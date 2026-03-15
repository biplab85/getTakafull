<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'claimant_id',
        'title',
        'claimant_name',
        'policy_number',
        'status',
        'date_of_incident',
        'time_of_incident',
        'amount_claimed',
        'location_of_incident',
        'type_of_incident',
        'estimated_cost_of_repairs',
        'description_of_incident',
        'damage_description',
        'vehicle_details',
        'witness_details',
        'bank_account_details',
        'declaration',
        'photos_of_the_damage',
        'police_report_file',
        'digital_signature',
        'voting_deadline',
        'review_token',
        'owner_review_reason',
    ];

    protected $casts = [
        'date_of_incident' => 'date',
        'amount_claimed' => 'decimal:2',
        'estimated_cost_of_repairs' => 'decimal:2',
        'voting_deadline' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($claim) {
            if (empty($claim->review_token)) {
                $claim->review_token = Str::random(64);
            }
        });
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function claimant()
    {
        return $this->belongsTo(User::class, 'claimant_id');
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function approvedVotes()
    {
        return $this->votes()->where('decision', 'approve');
    }

    public function deniedVotes()
    {
        return $this->votes()->where('decision', 'deny');
    }

    public function isVotingOpen(): bool
    {
        return $this->status === 'owner_approved'
            && $this->voting_deadline
            && $this->voting_deadline->isFuture();
    }

    public function hasUserVoted(int $userId): bool
    {
        return $this->votes()->where('user_id', $userId)->exists();
    }

    /**
     * Check if 70% of group members (excluding claimant) approved.
     */
    public function checkVotingResult(): ?string
    {
        $totalMembers = $this->group->activeMembers()->count();
        $eligibleVoters = $totalMembers - 1; // exclude claimant

        if ($eligibleVoters <= 0) {
            return null;
        }

        $approvedCount = $this->approvedVotes()->count();
        $approvalPercentage = ($approvedCount / $eligibleVoters) * 100;

        return $approvalPercentage >= 70 ? 'approved' : null;
    }
}
