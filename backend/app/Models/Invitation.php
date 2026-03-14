<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    protected $fillable = ['group_id', 'invited_by', 'email', 'status'];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
