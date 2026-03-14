<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $user = $request->user();

        if ($group->isMember($user->id)) {
            return response()->json(['message' => 'Already a member'], 409);
        }

        $group->members()->attach($user->id, ['role' => 'member']);
        $group->recalculate();

        return response()->json(['message' => 'Joined successfully']);
    }

    public function invite(Request $request, Group $group)
    {
        $request->validate([
            'emails' => 'required|array|min:1',
            'emails.*' => 'required|email',
        ]);

        $user = $request->user();

        foreach ($request->emails as $email) {
            Invitation::updateOrCreate(
                ['group_id' => $group->id, 'email' => $email],
                ['invited_by' => $user->id, 'status' => 'pending']
            );

            $groupTitle = $group->title;
            $joinUrl = config('app.frontend_url') . '/join/' . $group->group_token;

            Mail::raw(
                "You've been invited to join '{$groupTitle}' on GetTakaful.\n\nJoin here: {$joinUrl}",
                function ($message) use ($email, $groupTitle) {
                    $message->to($email)->subject("GetTakaful - Invitation to join {$groupTitle}");
                }
            );
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
