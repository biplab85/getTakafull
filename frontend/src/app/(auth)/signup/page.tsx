'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import AuthSkeleton from '@/components/auth/AuthSkeleton';
import PasswordInput from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/Toast';

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

const experienceOptions = [
  'No Experience',
  'Not Satisfied with the one I use',
  'I am looking for a new one',
  'I am very satisfied',
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    address: '',
    city: '',
    province: 'Alberta',
    knows_shariah_insurance: '',
    insurance_experience: '',
    expectation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password,
        phone: '',
      });
      await login(form.email, form.password);
      showToast('Account created successfully!');
    } catch (err: unknown) {
      const apiError = err as { message?: string; errors?: Record<string, string[]> };
      let msg = 'Registration failed.';
      if (apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];
        msg = firstError?.[0] || msg;
      } else {
        msg = apiError.message || msg;
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <div className="auth-logo">
        <img src="/img/logo.png" alt="GetTakaful" />
      </div>

      <div className="auth-card auth-card-wide">
        <div className="auth-form-side signup-form-side">
          <div className="signup-header-fixed">
            <div className="auth-heading">
              <button className="auth-back-btn" onClick={() => router.back()} type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h1>Let&apos;s create an account</h1>
            </div>

            {error && <div className="login-error">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="auth-form signup-form signup-form-scroll">
            {/* Email */}
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* First Name & Last Name */}
            <div className="signup-row">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input type="text" name="first_name" className="form-control" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
              </div>
              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input type="text" name="last_name" className="form-control" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password <span className="required">*</span></label>
              <PasswordInput name="password" value={form.password} onChange={handleChange} required minLength={8} />
            </div>

            {/* Address */}
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" className="form-control" value={form.address} onChange={handleChange} placeholder="Address" />
            </div>

            {/* City & Province */}
            <div className="signup-row">
              <div className="form-group">
                <label>City <span className="required">*</span></label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} placeholder="City" required />
              </div>
              <div className="form-group">
                <label>Province <span className="required">*</span></label>
                <select name="province" className="form-control" value={form.province} onChange={handleChange} required>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shariah Insurance Question */}
            <div className="signup-radio-section">
              <p className="signup-question">Do you know any Islami Shariah-based insurance in your area? <span className="required">*</span></p>
              <div className="signup-radio-options">
                <label className="signup-radio-label">
                  <input type="radio" name="knows_shariah_insurance" value="Yes" checked={form.knows_shariah_insurance === 'Yes'} onChange={handleChange} required />
                  <span className="signup-radio-custom"></span>
                  Yes
                </label>
                <label className="signup-radio-label">
                  <input type="radio" name="knows_shariah_insurance" value="No" checked={form.knows_shariah_insurance === 'No'} onChange={handleChange} />
                  <span className="signup-radio-custom"></span>
                  No
                </label>
              </div>
            </div>

            {/* Insurance Experience Question */}
            <div className="signup-radio-section">
              <p className="signup-question">How is your experience in the current insurance industry? <span className="required">*</span></p>
              <div className="signup-radio-options">
                {experienceOptions.map((opt) => (
                  <label className="signup-radio-label" key={opt}>
                    <input type="radio" name="insurance_experience" value={opt} checked={form.insurance_experience === opt} onChange={handleChange} required />
                    <span className="signup-radio-custom"></span>
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* Expectation */}
            <div className="form-group">
              <label>Can you describe your expectation from GetTakaful? <span className="required">*</span></label>
              <textarea
                name="expectation"
                className="form-control"
                value={form.expectation}
                onChange={handleChange}
                placeholder="Please write why you are looking for it, what improvement do you need from your current experience"
                rows={4}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Submit'} <span className="arrow-icon">&#x2197;</span>
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
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
