'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import AuthSkeleton from '@/components/auth/AuthSkeleton';
import { useToast } from '@/components/ui/Toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      showToast('Verification code sent to your email.');
      setStep('otp');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to send verification code.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      showToast('Email verified successfully!');
      router.push(`/signup?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Invalid verification code.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <img src="/img/logo.png" alt="GetTakaful" />
      </div>

      <div className="auth-card">
        <div className="auth-form-side">
          {step === 'email' ? (
            <>
              <div className="auth-heading">
                <button className="auth-back-btn" onClick={() => router.back()} type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <h1>Start with email</h1>
              </div>

              <p className="auth-description">
                To continue signing up, please enter your email<br />for verification with a one time code.
              </p>

              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Continue'} <span className="arrow-icon">&#x2197;</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <button className="auth-back-btn" onClick={() => { setStep('email'); setError(''); setOtp(''); }} type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <h1>Check your inbox</h1>
              </div>

              <p className="auth-description">
                We&apos;ve just emailed you a one time code. Please enter it below.
              </p>

              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group otp-form">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter code"
                    maxLength={6}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'} <span className="arrow-icon">&#x2197;</span>
                </button>
              </form>
            </>
          )}
        </div>

        <div className="auth-illustration-side">
          <AuthSkeleton />
        </div>
      </div>
    </div>
  );
}
