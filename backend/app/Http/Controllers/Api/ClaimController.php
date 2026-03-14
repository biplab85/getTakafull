<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Group;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
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
            'photos_of_the_damage' => 'nullable|image|max:5120',
            'police_report_file' => 'nullable|file|max:5120',
            'digital_signature' => 'nullable|image|max:2048',
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
        $data['status'] = 'pending';
        $data['voting_deadline'] = now()->addDays($request->input('voting_days', 7));

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

        return response()->json($claim, 201);
    }

    public function show(Claim $claim)
    {
        $claim->load([
            'claimant:id,first_name,last_name,profile_picture',
            'group:id,title,group_token',
            'votes.user:id,first_name,last_name',
        ]);

        $claim->append_data = [
            'total_participants' => $claim->votes->count(),
            'approved_votes' => $claim->votes->where('decision', 'approve')->count(),
            'denied_votes' => $claim->votes->where('decision', 'deny')->count(),
            'is_voting_open' => $claim->isVotingOpen(),
            'photos_url' => $claim->photos_of_the_damage ? asset('storage/' . $claim->photos_of_the_damage) : null,
            'report_url' => $claim->police_report_file ? asset('storage/' . $claim->police_report_file) : null,
            'signature_url' => $claim->digital_signature ? asset('storage/' . $claim->digital_signature) : null,
        ];

        return response()->json([
            'claim' => $claim,
            'voting' => $claim->append_data,
        ]);
    }

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

        return response()->json(['message' => 'Vote recorded successfully']);
    }
}
