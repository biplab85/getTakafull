<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'title',
        'description',
        'group_token',
        'amount_to_join',
        'minimum_number_of_people',
        'management_fee',
        'claims_processing_fee',
        'shariah_compliance_review_fee',
        'gettakaful_platform_fee',
        'total_contributions',
        'total_claims_paid',
        'pool_balance',
        'number_of_active_participants',
        'number_of_claims_submitted',
        'rules',
        'status',
    ];

    protected $casts = [
        'amount_to_join' => 'decimal:2',
        'management_fee' => 'decimal:2',
        'claims_processing_fee' => 'decimal:2',
        'shariah_compliance_review_fee' => 'decimal:2',
        'gettakaful_platform_fee' => 'decimal:2',
        'total_contributions' => 'decimal:2',
        'total_claims_paid' => 'decimal:2',
        'pool_balance' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($group) {
            if (empty($group->group_token)) {
                $group->group_token = Str::uuid()->toString();
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot('role', 'status', 'vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity')
            ->withTimestamps();
    }

    public function activeMembers()
    {
        return $this->members()->wherePivot('status', 'active');
    }

    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    public function isMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    public function recalculate(): void
    {
        $this->number_of_active_participants = $this->activeMembers()->count();
        $this->number_of_claims_submitted = $this->claims()->count();
        $this->total_contributions = $this->activeMembers()->count() * $this->amount_to_join;
        $this->pool_balance = $this->total_contributions - $this->total_claims_paid;
        $this->save();
    }
}
