<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    protected $fillable = ['claim_id', 'user_id', 'decision', 'comment'];

    public function claim()
    {
        return $this->belongsTo(Claim::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
