<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->string('review_token', 64)->nullable()->unique()->after('voting_deadline');
            $table->text('owner_review_reason')->nullable()->after('review_token');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn(['review_token', 'owner_review_reason']);
        });
    }
};
