<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        $myGroups = $user->createdGroups()->count();
        $joinedGroups = $user->groups()->count();
        $pendingClaims = Claim::whereIn('group_id', $user->groups()->pluck('groups.id'))
            ->where('status', 'pending')
            ->count();
        $totalClaimAmount = Claim::where('claimant_id', $user->id)->sum('amount_claimed');

        return response()->json([
            'my_takaful_count' => $myGroups,
            'total_joined_takaful' => $joinedGroups,
            'pending_claims' => $pendingClaims,
            'total_claim_amount' => number_format($totalClaimAmount, 2),
        ]);
    }

    public function pendingVotes(Request $request)
    {
        $user = $request->user();
        $groupIds = $user->groups()->pluck('groups.id');

        $claims = Claim::with(['group:id,title', 'claimant:id,first_name,last_name'])
            ->whereIn('group_id', $groupIds)
            ->where('status', 'pending')
            ->whereNotNull('voting_deadline')
            ->where('voting_deadline', '>', now())
            ->whereDoesntHave('votes', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($claim) {
                return [
                    'id' => $claim->id,
                    'title' => $claim->title,
                    'group_name' => $claim->group->title ?? '',
                    'group_id' => $claim->group_id,
                    'claimant_name' => $claim->claimant->full_name ?? '',
                    'amount' => $claim->amount_claimed,
                    'voting_deadline' => $claim->voting_deadline?->format('M d, Y'),
                    'status' => $claim->status,
                ];
            });

        return response()->json($claims);
    }

    public function recentClaimStatus(Request $request)
    {
        $user = $request->user();

        $claims = Claim::with(['group:id,title'])
            ->where('claimant_id', $user->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($claim) {
                return [
                    'id' => $claim->id,
                    'title' => $claim->title,
                    'group_name' => $claim->group->title ?? '',
                    'group_id' => $claim->group_id,
                    'amount' => $claim->amount_claimed,
                    'status' => $claim->status,
                    'date' => $claim->created_at?->format('M d, Y'),
                ];
            });

        return response()->json($claims);
    }
}
