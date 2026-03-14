'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthSkeleton from '@/components/auth/AuthSkeleton';
import PasswordInput from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back!');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Invalid email or password.';
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
            <h1>Welcome back! &#x1F44B;</h1>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
            <div className="form-group">
              <label>Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="auth-forgot-link">
              <Link href="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
                Forgot your password?
              </Link>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'} <span className="arrow-icon">&#x2197;</span>
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/verify-email" className="auth-link">
              Signup &#x2197;
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
