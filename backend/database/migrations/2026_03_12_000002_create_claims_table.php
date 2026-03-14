<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('claimant_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('claimant_name');
            $table->string('policy_number')->nullable();
            $table->string('status')->default('pending');
            $table->date('date_of_incident')->nullable();
            $table->string('time_of_incident')->nullable();
            $table->decimal('amount_claimed', 10, 2)->default(0);
            $table->string('location_of_incident')->nullable();
            $table->string('type_of_incident')->nullable();
            $table->decimal('estimated_cost_of_repairs', 10, 2)->default(0);
            $table->text('description_of_incident')->nullable();
            $table->text('damage_description')->nullable();
            $table->text('vehicle_details')->nullable();
            $table->text('witness_details')->nullable();
            $table->text('bank_account_details')->nullable();
            $table->text('declaration')->nullable();
            $table->string('photos_of_the_damage')->nullable();
            $table->string('police_report_file')->nullable();
            $table->string('digital_signature')->nullable();
            $table->timestamp('voting_deadline')->nullable();
            $table->timestamps();
        });

        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('decision'); // approve or deny
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['claim_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
        Schema::dropIfExists('claims');
    }
};
