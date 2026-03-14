<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('group_members', function (Blueprint $table) {
            $table->string('vehicle_make')->nullable()->after('status');
            $table->string('vehicle_model')->nullable()->after('vehicle_make');
            $table->string('identification_number')->nullable()->after('vehicle_model');
            $table->string('registration_number')->nullable()->after('identification_number');
            $table->string('engine_size_capacity')->nullable()->after('registration_number');
        });
    }

    public function down(): void
    {
        Schema::table('group_members', function (Blueprint $table) {
            $table->dropColumn(['vehicle_make', 'vehicle_model', 'identification_number', 'registration_number', 'engine_size_capacity']);
        });
    }
};
