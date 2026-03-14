<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GroupController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

// Public group lookup by token
Route::get('/groups/token/{token}', [GroupController::class, 'showByToken']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/pending-votes', [DashboardController::class, 'pendingVotes']);
    Route::get('/dashboard/recent-claims', [DashboardController::class, 'recentClaimStatus']);

    // Groups
    Route::get('/groups/my', [GroupController::class, 'myGroups']);
    Route::get('/groups/joined', [GroupController::class, 'joinedGroups']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::get('/groups/{group}', [GroupController::class, 'show']);
    Route::post('/groups/{group}/join', [GroupController::class, 'join']);
    Route::post('/groups/{group}/invite', [GroupController::class, 'invite']);
    Route::get('/groups/{group}/claims', [GroupController::class, 'claims']);

    // Claims
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::get('/claims/{claim}', [ClaimController::class, 'show']);
    Route::post('/claims/{claim}/vote', [ClaimController::class, 'vote']);
});
