<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('group_token')->unique();
            $table->decimal('amount_to_join', 10, 2)->default(0);
            $table->integer('minimum_number_of_people')->default(0);
            $table->decimal('management_fee', 10, 2)->default(0);
            $table->decimal('claims_processing_fee', 10, 2)->default(0);
            $table->decimal('shariah_compliance_review_fee', 10, 2)->default(0);
            $table->decimal('gettakaful_platform_fee', 10, 2)->default(0);
            $table->decimal('total_contributions', 10, 2)->default(0);
            $table->decimal('total_claims_paid', 10, 2)->default(0);
            $table->decimal('pool_balance', 10, 2)->default(0);
            $table->integer('number_of_active_participants')->default(0);
            $table->integer('number_of_claims_submitted')->default(0);
            $table->text('rules')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_members');
        Schema::dropIfExists('groups');
    }
};
