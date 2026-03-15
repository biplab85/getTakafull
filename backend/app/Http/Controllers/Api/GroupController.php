<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\GroupInvitation;
use App\Models\Group;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class GroupController extends Controller
{
    public function myGroups(Request $request)
    {
        $groups = $request->user()->createdGroups()
            ->withCount('activeMembers')
            ->latest()
            ->get();

        return response()->json($groups);
    }

    public function joinedGroups(Request $request)
    {
        $groups = $request->user()->groups()
            ->withCount('activeMembers')
            ->latest()
            ->get();

        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount_to_join' => 'required|numeric|min:0',
            'minimum_number_of_people' => 'required|integer|min:1',
            'management_fee' => 'nullable|numeric|min:0',
            'claims_processing_fee' => 'nullable|numeric|min:0',
            'shariah_compliance_review_fee' => 'nullable|numeric|min:0',
            'gettakaful_platform_fee' => 'nullable|numeric|min:0',
            'rules' => 'nullable|string',
        ]);

        $group = Group::create([
            'creator_id' => $request->user()->id,
            ...$request->only([
                'title', 'description', 'amount_to_join',
                'minimum_number_of_people', 'management_fee',
                'claims_processing_fee', 'shariah_compliance_review_fee',
                'gettakaful_platform_fee', 'rules',
            ]),
        ]);

        // Creator auto-joins as admin
        $group->members()->attach($request->user()->id, ['role' => 'admin']);
        $group->recalculate();

        return response()->json($group, 201);
    }

    public function show(Group $group)
    {
        $group->load(['creator:id,first_name,last_name', 'activeMembers:id,first_name,last_name,email']);
        $group->loadCount(['activeMembers', 'claims']);

        return response()->json($group);
    }

    public function showByToken(string $token)
    {
        $group = Group::where('group_token', $token)->firstOrFail();
        $group->load(['creator:id,first_name,last_name']);

        return response()->json($group);
    }

    public function join(Request $request, Group $group)
    {
        $request->validate([
            'street_address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'knows_shariah_insurance' => 'nullable|string|in:yes,no',
            'insurance_experience' => 'nullable|string|max:255',
            'expectation' => 'nullable|string',
            'profile_picture' => 'nullable|string',
            'profile_picture_url' => 'nullable|url',
            'vehicle_make' => 'nullable|string|max:255',
            'vehicle_model' => 'nullable|string|max:255',
            'identification_number' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'engine_size_capacity' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        if ($group->isMember($user->id)) {
            return response()->json(['message' => 'Already a member'], 409);
        }

        // Update user profile fields if provided
        $profileFields = $request->only([
            'street_address', 'city', 'province',
            'knows_shariah_insurance', 'insurance_experience', 'expectation',
        ]);
        $profileFields = array_filter($profileFields, fn($v) => $v !== null && $v !== '');
        if (!empty($profileFields)) {
            $user->update($profileFields);
        }

        // Attach user to group with vehicle info
        $pivotData = ['role' => 'member'];
        $vehicleFields = ['vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity'];
        foreach ($vehicleFields as $field) {
            if ($request->filled($field)) {
                $pivotData[$field] = $request->input($field);
            }
        }

        $group->members()->attach($user->id, $pivotData);
        $group->recalculate();

        // Update invitation status if exists
        Invitation::where('group_id', $group->id)
            ->where('email', $user->email)
            ->where('status', 'pending')
            ->update(['status' => 'accepted']);

        return response()->json(['message' => 'Joined successfully']);
    }

    public function invite(Request $request, Group $group)
    {
        $request->validate([
            'emails' => 'required|array|min:1',
            'emails.*' => 'required|email',
        ]);

        $user = $request->user();

        $joinUrl = config('app.frontend_url') . '/join/' . $group->group_token;

        foreach ($request->emails as $email) {
            Invitation::updateOrCreate(
                ['group_id' => $group->id, 'email' => $email],
                ['invited_by' => $user->id, 'status' => 'pending']
            );

            Mail::to($email)->send(new GroupInvitation($group, $joinUrl));
        }

        return response()->json(['message' => 'Invitations sent']);
    }

    public function claims(Group $group)
    {
        $claims = $group->claims()
            ->with('claimant:id,first_name,last_name,profile_picture')
            ->latest()
            ->get();

        return response()->json($claims);
    }
}
