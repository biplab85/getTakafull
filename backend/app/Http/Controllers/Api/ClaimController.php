<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ClaimSubmitted;
use App\Mail\ClaimReadyToVote;
use App\Models\Claim;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ClaimController extends Controller
{
    /**
     * Submit a new claim. Sends email to group owner for review.
     */
    public function store(Request $request)
    {
        $request->validate([
            'group_id' => 'required|exists:groups,id',
            'title' => 'required|string|max:255',
            'date_of_incident' => 'required|date',
            'time_of_incident' => 'nullable|string',
            'amount_claimed' => 'required|numeric|min:0',
            'location_of_incident' => 'nullable|string',
            'type_of_incident' => 'nullable|string',
            'estimated_cost_of_repairs' => 'nullable|numeric|min:0',
            'description_of_incident' => 'nullable|string',
            'damage_description' => 'nullable|string',
            'vehicle_details' => 'nullable|string',
            'witness_details' => 'nullable|string',
            'bank_account_details' => 'nullable|string',
            'declaration' => 'nullable|string',
            'photos_of_the_damage' => 'required|image|max:5120',
            'police_report_file' => 'required|file|max:5120',
            'digital_signature' => 'required|image|max:2048',
            'voting_days' => 'nullable|integer|min:1|max:30',
        ]);

        $user = $request->user();
        $group = Group::findOrFail($request->group_id);

        if (!$group->isMember($user->id)) {
            return response()->json(['message' => 'You are not a member of this group'], 403);
        }

        $data = $request->only([
            'group_id', 'title', 'date_of_incident', 'time_of_incident',
            'amount_claimed', 'location_of_incident', 'type_of_incident',
            'estimated_cost_of_repairs', 'description_of_incident',
            'damage_description', 'vehicle_details', 'witness_details',
            'bank_account_details', 'declaration',
        ]);

        $data['claimant_id'] = $user->id;
        $data['claimant_name'] = $user->full_name;
        $data['policy_number'] = 'POL-' . strtoupper(substr(md5($user->id . $group->id), 0, 8));
        $data['status'] = 'pending'; // Waiting for owner review
        $data['voting_deadline'] = now()->addDays((int) $request->input('voting_days', 7));

        if ($request->hasFile('photos_of_the_damage')) {
            $data['photos_of_the_damage'] = $request->file('photos_of_the_damage')->store('claims/photos', 'public');
        }
        if ($request->hasFile('police_report_file')) {
            $data['police_report_file'] = $request->file('police_report_file')->store('claims/reports', 'public');
        }
        if ($request->hasFile('digital_signature')) {
            $data['digital_signature'] = $request->file('digital_signature')->store('claims/signatures', 'public');
        }

        $claim = Claim::create($data);
        $group->recalculate();

        // Send email to group owner with review link
        $group->load('creator');
        $reviewUrl = config('app.frontend_url') . '/claims/' . $claim->id . '?review_token=' . $claim->review_token;
        Mail::to($group->creator->email)->send(new ClaimSubmitted($claim, $reviewUrl));

        return response()->json($claim, 201);
    }

    /**
     * Show claim details with voting stats.
     */
    public function show(Request $request, Claim $claim)
    {
        $claim->load([
            'claimant:id,first_name,last_name,profile_picture',
            'group:id,title,group_token,creator_id',
            'votes.user:id,first_name,last_name',
        ]);

        $user = $request->user();
        $isOwner = $claim->group && $claim->group->creator_id === $user->id;
        $isMember = $claim->group && $claim->group->isMember($user->id);
        $isClaimant = $claim->claimant_id === $user->id;

        // Calculate voting result
        $totalMembers = $claim->group ? $claim->group->activeMembers()->count() : 0;
        $eligibleVoters = max($totalMembers - 1, 0); // exclude claimant
        $approvedCount = $claim->votes->where('decision', 'approve')->count();
        $deniedCount = $claim->votes->where('decision', 'deny')->count();
        $approvalPercentage = $eligibleVoters > 0 ? round(($approvedCount / $eligibleVoters) * 100) : 0;

        $votingData = [
            'total_participants' => $claim->votes->count(),
            'approved_votes' => $approvedCount,
            'denied_votes' => $deniedCount,
            'eligible_voters' => $eligibleVoters,
            'approval_percentage' => $approvalPercentage,
            'approval_threshold' => 70,
            'is_voting_open' => $claim->isVotingOpen(),
            'has_voted' => $isMember ? $claim->hasUserVoted($user->id) : false,
            'can_vote' => $isMember && !$isClaimant && $claim->isVotingOpen() && !$claim->hasUserVoted($user->id),
            'is_owner' => $isOwner,
            'can_review' => $isOwner && $claim->status === 'pending',
            'photos_url' => $claim->photos_of_the_damage ? asset('storage/' . $claim->photos_of_the_damage) : null,
            'report_url' => $claim->police_report_file ? asset('storage/' . $claim->police_report_file) : null,
            'signature_url' => $claim->digital_signature ? asset('storage/' . $claim->digital_signature) : null,
        ];

        return response()->json([
            'claim' => $claim,
            'voting' => $votingData,
        ]);
    }

    /**
     * Owner reviews a claim: approve or reject.
     * If approved, emails all group members to vote.
     */
    public function ownerReview(Request $request, Claim $claim)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'reason' => 'required_if:decision,reject|nullable|string',
        ]);

        $user = $request->user();

        // Only the group owner can review
        if ($claim->group->creator_id !== $user->id) {
            return response()->json(['message' => 'Only the group owner can review claims'], 403);
        }

        if ($claim->status !== 'pending') {
            return response()->json(['message' => 'This claim has already been reviewed'], 400);
        }

        if ($request->decision === 'reject') {
            $claim->update([
                'status' => 'rejected',
                'owner_review_reason' => $request->reason,
            ]);

            return response()->json(['message' => 'Claim has been rejected']);
        }

        // Owner approved - update status and reset voting deadline from now
        $claim->update([
            'status' => 'owner_approved',
            'voting_deadline' => now()->addDays(7),
        ]);

        // Send voting emails to all group members (except the claimant)
        $claim->load('group.activeMembers');
        $voteUrl = config('app.frontend_url') . '/claims/' . $claim->id;

        foreach ($claim->group->activeMembers as $index => $member) {
            if ($member->id === $claim->claimant_id) {
                continue; // Skip the claimant
            }
            if ($index > 0) {
                sleep(1); // Rate limit for Mailtrap free plan
            }
            Mail::to($member->email)->send(new ClaimReadyToVote($claim, $voteUrl));
        }

        return response()->json(['message' => 'Claim approved. Voting emails sent to all members.']);
    }

    /**
     * Cast a vote on a claim. After each vote, check if 70% threshold is met.
     */
    public function vote(Request $request, Claim $claim)
    {
        $request->validate([
            'decision' => 'required|in:approve,deny',
            'comment' => 'nullable|string',
        ]);

        $user = $request->user();

        if (!$claim->group->isMember($user->id)) {
            return response()->json(['message' => 'Not a member of this group'], 403);
        }

        if ($claim->claimant_id === $user->id) {
            return response()->json(['message' => 'Cannot vote on your own claim'], 403);
        }

        if (!$claim->isVotingOpen()) {
            return response()->json(['message' => 'Voting is closed'], 403);
        }

        if ($claim->hasUserVoted($user->id)) {
            return response()->json(['message' => 'Already voted'], 409);
        }

        $claim->votes()->create([
            'user_id' => $user->id,
            'decision' => $request->decision,
            'comment' => $request->comment,
        ]);

        // Check if 70% approval threshold is met
        $result = $claim->checkVotingResult();
        if ($result === 'approved') {
            $claim->update(['status' => 'approved']);
        }

        return response()->json(['message' => 'Vote recorded successfully']);
    }
}
