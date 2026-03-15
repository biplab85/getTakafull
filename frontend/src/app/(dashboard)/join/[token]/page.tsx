'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { groupsApi, paymentsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface GroupPreview {
  id: number;
  title: string;
  name?: string;
  description: string;
  amount_to_join: string;
  minimum_number_of_people: number;
  minimum_members?: number;
  creator?: { id: number; first_name: string; last_name: string };
}

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Northwest Territories', 'Nunavut', 'Yukon',
];

const EXPERIENCE_OPTIONS = [
  'No Experience', 'Less than 1 year', '1-3 years', '3-5 years', '5+ years',
];

export default function JoinByTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { token: authToken, user } = useAuth();
  const groupToken = params.token as string;
  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const [form, setForm] = useState({
    street_address: '',
    city: '',
    province: 'Alberta',
    knows_shariah_insurance: 'yes',
    insurance_experience: 'No Experience',
    expectation: '',
    vehicle_make: '',
    vehicle_model: '',
    identification_number: '',
    registration_number: '',
    engine_size_capacity: '',
  });

  const loadGroup = useCallback(async () => {
    try {
      const data = await groupsApi.showByToken(groupToken) as GroupPreview;
      setGroup(data);
    } catch {
      setError('Invalid or expired invitation link.');
    } finally {
      setLoading(false);
    }
  }, [groupToken]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  useEffect(() => {
    if (user) {
      const u = user as unknown as Record<string, string>;
      const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : '';
      setForm(prev => ({
        ...prev,
        street_address: u.street_address || '',
        city: u.city || '',
        province: u.province || 'Alberta',
        knows_shariah_insurance: u.knows_shariah_insurance || 'yes',
        insurance_experience: u.insurance_experience || 'No Experience',
        expectation: stripHtml(u.expectation || ''),
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !group) return;

    setSubmitting(true);
    setError('');

    const amount = parseFloat(group.amount_to_join);

    try {
      if (amount > 0) {
        // Create Stripe Checkout Session and redirect
        const { checkout_url } = await paymentsApi.createCheckout(authToken, group.id, form);
        window.location.href = checkout_url;
      } else {
        // No payment — join directly
        await groupsApi.join(authToken, group.id, form);
        showToast('Successfully joined the Takaful group!');
        router.push(`/groups/${group.id}`);
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!group) {
    return (
      <div className="main-container-wrapper">
        <EmptyState icon="not-found" message="Invalid Invitation" subtitle={error || 'This invitation link is expired or invalid.'} />
      </div>
    );
  }

  const groupTitle = group.title || group.name || 'Untitled Group';
  const amount = parseFloat(group.amount_to_join);
  const creatorName = group.creator ? `${group.creator.first_name} ${group.creator.last_name}` : '';

  return (
    <div className="main-container-wrapper">
      <div className="join-page">
        {/* Back Arrow + Page Title */}
        <div className="join-page-header">
          <button onClick={() => router.back()} className="join-back-btn" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="join-page-title">{groupTitle}</h1>
            {creatorName && <p className="join-page-subtitle">Created by {creatorName}</p>}
          </div>
        </div>

        {/* Group Info Banner */}
        <div className="join-info-banner">
          <div className="join-info-banner-inner">
            <div className="join-info-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <div>
                <span className="join-info-label">Shariah-Compliant</span>
                <span className="join-info-value">Insurance Group</span>
              </div>
            </div>
            <div className="join-info-divider" />
            <div className="join-info-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <div>
                <span className="join-info-label">Joining Fee</span>
                <span className="join-info-value">{amount > 0 ? `CAD $${amount.toFixed(2)}` : 'Free'}</span>
              </div>
            </div>
            <div className="join-info-divider" />
            <div className="join-info-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              <div>
                <span className="join-info-label">Min. Members</span>
                <span className="join-info-value">{group.minimum_number_of_people || group.minimum_members || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="join-form">
          {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

          {/* Personal Information Section */}
          <div className="join-section">
            <div className="join-section-header">
              <div className="join-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h2 className="join-section-title">Personal Information</h2>
            </div>

            <div className="form-group">
              <label>User Address</label>
              <input type="text" name="street_address" className="form-control" value={form.street_address} onChange={handleChange} placeholder="Enter your street address" />
            </div>

            <div className="join-form-row">
              <div className="form-group">
                <label>User City</label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} placeholder="Enter your city" />
              </div>
              <div className="form-group">
                <label>User Province</label>
                <select name="province" className="form-control" value={form.province} onChange={handleChange}>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Insurance Background Section */}
          <div className="join-section">
            <div className="join-section-header">
              <div className="join-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <h2 className="join-section-title">Insurance Background</h2>
            </div>

            <div className="form-group">
              <label>Do you know any Islami Shariah-based insurance in your area?</label>
              <div className="join-radio-group">
                <label className={`join-radio-option${form.knows_shariah_insurance === 'yes' ? ' join-radio-selected' : ''}`}>
                  <input type="radio" name="knows_shariah_insurance" value="yes" checked={form.knows_shariah_insurance === 'yes'} onChange={handleChange} className="join-radio-input" />
                  <span className="join-radio-dot" />
                  <span className="join-radio-label">Yes</span>
                </label>
                <label className={`join-radio-option${form.knows_shariah_insurance === 'no' ? ' join-radio-selected' : ''}`}>
                  <input type="radio" name="knows_shariah_insurance" value="no" checked={form.knows_shariah_insurance === 'no'} onChange={handleChange} className="join-radio-input" />
                  <span className="join-radio-dot" />
                  <span className="join-radio-label">No</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>How is your experience in the current insurance industry?</label>
              <select name="insurance_experience" className="form-control" value={form.insurance_experience} onChange={handleChange}>
                {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Can you describe your expectation from GetTakaful?</label>
              <textarea name="expectation" className="form-control" value={form.expectation} onChange={handleChange} rows={4} placeholder="Share your expectations..." />
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="join-section">
            <div className="join-section-header">
              <div className="join-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h3l3 3v5h-6V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              </div>
              <h2 className="join-section-title">Vehicle Information</h2>
            </div>

            <div className="join-form-row">
              <div className="form-group">
                <label>Vehicle Make</label>
                <input type="text" name="vehicle_make" className="form-control" value={form.vehicle_make} onChange={handleChange} placeholder="e.g. Toyota" />
              </div>
              <div className="form-group">
                <label>Vehicle Model</label>
                <input type="text" name="vehicle_model" className="form-control" value={form.vehicle_model} onChange={handleChange} placeholder="e.g. Camry" />
              </div>
            </div>

            <div className="join-form-row join-form-3col">
              <div className="form-group">
                <label>Identification Number</label>
                <input type="text" name="identification_number" className="form-control" value={form.identification_number} onChange={handleChange} placeholder="VIN" />
              </div>
              <div className="form-group">
                <label>Registration Number</label>
                <input type="text" name="registration_number" className="form-control" value={form.registration_number} onChange={handleChange} placeholder="Plate #" />
              </div>
              <div className="form-group">
                <label>Engine Size / Capacity</label>
                <input type="text" name="engine_size_capacity" className="form-control" value={form.engine_size_capacity} onChange={handleChange} placeholder="e.g. 2.5L" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="join-submit-btn" disabled={submitting}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {submitting ? 'Processing...' : (amount > 0 ? `Submit & Pay — CAD $${amount.toFixed(2)}` : 'Submit & Join')}
          </button>

          {amount > 0 && (
            <p className="join-stripe-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              You will be redirected to Stripe&apos;s secure checkout to complete payment
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
