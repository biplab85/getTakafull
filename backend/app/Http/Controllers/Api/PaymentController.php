<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Invitation;
use App\Models\Payment;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a Stripe Checkout Session and return the URL to redirect to.
     */
    public function createCheckout(Request $request, Group $group)
    {
        $request->validate([
            'form_data' => 'nullable|array',
        ]);

        $user = $request->user();

        if ($group->isMember($user->id)) {
            return response()->json(['message' => 'Already a member of this group'], 409);
        }

        $amount = (int) round($group->amount_to_join * 100);

        if ($amount <= 0) {
            return response()->json(['message' => 'No payment required for this group'], 400);
        }

        $frontendUrl = config('app.frontend_url');

        // Store form data in session metadata so we can retrieve it after payment
        $formData = $request->input('form_data', []);
        $metadataFields = ['vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity'];
        $metadata = [
            'user_id' => (string) $user->id,
            'group_id' => (string) $group->id,
        ];
        foreach ($metadataFields as $field) {
            if (!empty($formData[$field])) {
                $metadata[$field] = $formData[$field];
            }
        }

        // Store profile data as JSON in metadata
        $profileFields = ['street_address', 'city', 'province', 'knows_shariah_insurance', 'insurance_experience', 'expectation'];
        $profileData = [];
        foreach ($profileFields as $field) {
            if (!empty($formData[$field])) {
                $profileData[$field] = $formData[$field];
            }
        }
        if (!empty($profileData)) {
            $metadata['profile_data'] = json_encode($profileData);
        }

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'customer_email' => $user->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => 'cad',
                    'product_data' => [
                        'name' => $group->title,
                        'description' => "Joining fee for {$group->title}",
                    ],
                    'unit_amount' => $amount,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $frontendUrl . '/join/' . $group->group_token . '/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $frontendUrl . '/join/' . $group->group_token,
            'metadata' => $metadata,
        ]);

        // Create local payment record
        Payment::create([
            'user_id' => $user->id,
            'group_id' => $group->id,
            'stripe_payment_intent_id' => $session->id,
            'amount' => $group->amount_to_join,
            'currency' => 'cad',
            'status' => 'pending',
            'description' => "Joining fee for {$group->title}",
        ]);

        return response()->json([
            'checkout_url' => $session->url,
            'session_id' => $session->id,
        ]);
    }

    /**
     * Verify a checkout session and complete the join process.
     */
    public function verifySession(Request $request, Group $group)
    {
        $request->validate([
            'session_id' => 'required|string',
        ]);

        $user = $request->user();
        $session = StripeSession::retrieve($request->session_id);

        if ($session->payment_status !== 'paid') {
            return response()->json(['message' => 'Payment not completed'], 400);
        }

        // Verify this session belongs to this user/group
        if ($session->metadata->user_id != $user->id || $session->metadata->group_id != $group->id) {
            return response()->json(['message' => 'Invalid session'], 403);
        }

        // Update payment record
        $payment = Payment::where('stripe_payment_intent_id', $session->id)
            ->where('user_id', $user->id)
            ->first();

        if ($payment) {
            $payment->update(['status' => 'succeeded']);
        }

        // Add user to group if not already a member
        if (!$group->isMember($user->id)) {
            $pivotData = ['role' => 'member'];
            $vehicleFields = ['vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity'];
            foreach ($vehicleFields as $field) {
                if (!empty($session->metadata->$field)) {
                    $pivotData[$field] = $session->metadata->$field;
                }
            }

            $group->members()->attach($user->id, $pivotData);
            $group->recalculate();

            // Update user profile data
            if (!empty($session->metadata->profile_data)) {
                $profileData = json_decode($session->metadata->profile_data, true);
                if (is_array($profileData) && !empty($profileData)) {
                    $user->update($profileData);
                }
            }

            // Update invitation status
            Invitation::where('group_id', $group->id)
                ->where('email', $user->email)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);
        }

        return response()->json([
            'message' => 'Payment verified, you have joined the group',
            'group_id' => $group->id,
        ]);
    }

    /**
     * Handle Stripe webhooks.
     */
    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;

            if ($session->payment_status === 'paid') {
                $payment = Payment::where('stripe_payment_intent_id', $session->id)->first();

                if ($payment && $payment->status !== 'succeeded') {
                    $payment->update(['status' => 'succeeded']);

                    $group = Group::find($payment->group_id);
                    if ($group && !$group->isMember($payment->user_id)) {
                        $pivotData = ['role' => 'member'];
                        $vehicleFields = ['vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity'];
                        foreach ($vehicleFields as $field) {
                            if (!empty($session->metadata->$field)) {
                                $pivotData[$field] = $session->metadata->$field;
                            }
                        }

                        $group->members()->attach($payment->user_id, $pivotData);
                        $group->recalculate();

                        // Update invitation status
                        $userEmail = \App\Models\User::find($payment->user_id)?->email;
                        if ($userEmail) {
                            Invitation::where('group_id', $group->id)
                                ->where('email', $userEmail)
                                ->where('status', 'pending')
                                ->update(['status' => 'accepted']);
                        }
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Get payment history for the authenticated user.
     */
    public function history(Request $request)
    {
        $payments = Payment::where('user_id', $request->user()->id)
            ->with('group:id,title')
            ->latest()
            ->get();

        return response()->json($payments);
    }
}
