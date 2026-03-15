<?php

namespace App\Mail;

use App\Models\Group;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GroupInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Group $group,
        public string $joinUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "GetTakaful - Invitation to join {$this->group->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.group-invitation',
        );
    }
}
