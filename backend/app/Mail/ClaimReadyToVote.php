<?php

namespace App\Mail;

use App\Models\Claim;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClaimReadyToVote extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Claim $claim,
        public string $voteUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "GetTakaful - Vote on Claim in {$this->claim->group->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.claim-vote',
        );
    }
}
