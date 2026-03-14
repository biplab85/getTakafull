<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('street_address')->nullable()->after('phone');
            $table->string('address_line_2')->nullable()->after('street_address');
            $table->string('city')->nullable()->after('address_line_2');
            $table->string('province')->nullable()->after('city');
            $table->string('knows_shariah_insurance')->nullable()->after('province');
            $table->string('insurance_experience')->nullable()->after('knows_shariah_insurance');
            $table->text('expectation')->nullable()->after('insurance_experience');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'street_address',
                'address_line_2',
                'city',
                'province',
                'knows_shariah_insurance',
                'insurance_experience',
                'expectation',
            ]);
        });
    }
};
