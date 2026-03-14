<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address.'],
            ]);
        }

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'street_address' => $user->street_address,
            'address_line_2' => $user->address_line_2,
            'city' => $user->city,
            'province' => $user->province,
            'knows_shariah_insurance' => $user->knows_shariah_insurance,
            'insurance_experience' => $user->insurance_experience,
            'expectation' => $user->expectation,
            'profile_picture' => $user->profile_picture_url,
            'email_verified_at' => $user->email_verified_at,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'street_address' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'knows_shariah_insurance' => 'nullable|string|max:10',
            'insurance_experience' => 'nullable|string|max:255',
            'expectation' => 'nullable|string',
            'profile_picture' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $user->profile_picture = $path;
        }

        $user->fill($request->only([
            'first_name', 'last_name', 'phone',
            'street_address', 'address_line_2', 'city', 'province',
            'knows_shariah_insurance', 'insurance_experience', 'expectation',
        ]));
        $user->save();

        return response()->json(['user' => $user, 'message' => 'Profile updated']);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->password = $request->password;
        $user->save();

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::where('email', $request->email)->first();
        if ($user) {
            $user->update([
                'otp_code' => Hash::make($otp),
                'otp_expires_at' => now()->addMinutes(10),
            ]);
        } else {
            // Store OTP temporarily for new registrations
            cache()->put('otp_' . $request->email, [
                'code' => Hash::make($otp),
                'expires_at' => now()->addMinutes(10),
            ], 600);
        }

        Mail::raw("Your GetTakaful verification code is: {$otp}", function ($message) use ($request) {
            $message->to($request->email)->subject('GetTakaful - Email Verification Code');
        });

        return response()->json(['message' => 'OTP sent successfully']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            if (!$user->otp_code || !Hash::check($request->otp, $user->otp_code)) {
                return response()->json(['message' => 'Invalid OTP'], 422);
            }
            if ($user->otp_expires_at && $user->otp_expires_at->isPast()) {
                return response()->json(['message' => 'OTP has expired'], 422);
            }
            $user->update([
                'email_verified_at' => now(),
                'otp_code' => null,
                'otp_expires_at' => null,
            ]);
            return response()->json(['message' => 'Email verified successfully', 'verified' => true]);
        }

        // Check cache for pre-registration OTP
        $cached = cache()->get('otp_' . $request->email);
        if ($cached && Hash::check($request->otp, $cached['code'])) {
            cache()->forget('otp_' . $request->email);
            return response()->json(['message' => 'OTP verified', 'verified' => true]);
        }

        return response()->json(['message' => 'Invalid OTP'], 422);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'No user found with that email'], 404);
        }

        $newPassword = Str::random(12);
        $user->password = $newPassword;
        $user->save();

        Mail::raw("Your new GetTakaful password is: {$newPassword}", function ($message) use ($user) {
            $message->to($user->email)->subject('GetTakaful - Your New Password');
        });

        return response()->json(['message' => 'New password sent to your email']);
    }
}
