'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import AuthSkeleton from '@/components/auth/AuthSkeleton';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email) as { message: string };
      const msg = res.message || 'A new password has been sent to your email.';
      setSuccess(msg);
      showToast(msg);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to process request.';
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
          <div className="auth-heading">
            <button className="auth-back-btn" onClick={() => router.back()} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1>Lost Password</h1>
          </div>

          <p className="auth-description">
            Please enter your email address. You will receive a reset password.
          </p>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="success-message" style={{ marginBottom: 16 }}>{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Get New Password'} <span className="arrow-icon">&#x2197;</span>
              </button>
            </form>
          )}

          <div className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/login" className="auth-link">
              Login &#x2197;
            </Link>
          </div>
        </div>

        <div className="auth-illustration-side">
          <AuthSkeleton />
        </div>
      </div>
    </div>
  );
}
