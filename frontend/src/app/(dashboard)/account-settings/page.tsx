'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import PasswordInput from '@/components/ui/PasswordInput';
import ImageUploader from '@/components/ui/ImageUploader';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useToast } from '@/components/ui/Toast';

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  return (
    <div className="main-container-wrapper">
      <div className="all-medicali-trials acc-settings-frms">
        <h2 className="text-xl font-medium mb-4">Account settings</h2>
        <div className="medical-trials-tabs">
          <ul className="nav-tabs">
            <li>
              <button
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Password
              </button>
            </li>
          </ul>

          <div className="mt-5">
            {activeTab === 'profile' ? <ProfileForm /> : <PasswordForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function ProfileForm() {
  const { user, token, refreshUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    street_address: '',
    address_line_2: '',
    city: '',
    province: 'Alberta',
    knows_shariah_insurance: 'Yes',
    insurance_experience: 'No Experience',
    expectation: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('first_name', form.first_name);
    formData.append('last_name', form.last_name);
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    try {
      await authApi.updateProfile(token, formData);
      await refreshUser();
      showToast('Profile updated successfully.');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to update profile.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 550 }}>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Profile Image */}
      <ImageUploader currentImage={user?.profile_picture} onFileSelect={setProfilePicture} />

      {/* Name */}
      <div className="form-group">
        <label>Name <span className="required">*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <input type="text" className="form-control" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First" required />
            <span style={{ fontSize: 11, color: 'var(--text-default-color)' }}>First</span>
          </div>
          <div>
            <input type="text" className="form-control" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last" required />
            <span style={{ fontSize: 11, color: 'var(--text-default-color)' }}>Last</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="form-group">
        <label>Address <span className="required">*</span></label>
        <input type="text" className="form-control" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} required />
        <span style={{ fontSize: 11, color: 'var(--text-default-color)' }}>Street Address</span>
      </div>

      <div className="form-group">
        <label>Address Line 2</label>
        <input type="text" className="form-control" value={form.address_line_2} onChange={(e) => setForm({ ...form, address_line_2: e.target.value })} />
      </div>

      {/* City & Province */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <input type="text" className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required />
          <span style={{ fontSize: 11, color: 'var(--text-default-color)' }}>City</span>
        </div>
        <div>
          <select className="form-control" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237B828A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-default-color)' }}>Province</span>
        </div>
      </div>

      {/* Shariah Insurance Question */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 8 }}>
          Do you know any Islami Shariah-based insurance in your area? <span className="required">*</span>
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" name="knows_shariah_insurance" value="Yes" checked={form.knows_shariah_insurance === 'Yes'} onChange={(e) => setForm({ ...form, knows_shariah_insurance: e.target.value })} style={{ accentColor: 'var(--brand-color)' }} />
            Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" name="knows_shariah_insurance" value="No" checked={form.knows_shariah_insurance === 'No'} onChange={(e) => setForm({ ...form, knows_shariah_insurance: e.target.value })} style={{ accentColor: 'var(--brand-color)' }} />
            No
          </label>
        </div>
      </div>

      {/* Insurance Experience */}
      <div className="form-group">
        <label>How is your experience in the current insurance industry? <span className="required">*</span></label>
        <select className="form-control" value={form.insurance_experience} onChange={(e) => setForm({ ...form, insurance_experience: e.target.value })} required style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237B828A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}>
          {experienceOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Expectation */}
      <div className="form-group">
        <label>Can you describe your expectation from GetTakaful? <span className="required">*</span></label>
        <RichTextEditor value={form.expectation} onChange={(val) => setForm({ ...form, expectation: val })} placeholder="Please write why you are looking for it, what improvement do you need from your current experience" />
      </div>

      <button type="submit" className="lab-btn" disabled={loading}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await authApi.updatePassword(token, form);
      showToast('Password updated successfully.');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to update password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="form-group">
        <label>Current Password <span className="required">*</span></label>
        <PasswordInput value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
      </div>
      <div className="form-group">
        <label>New Password <span className="required">*</span></label>
        <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
      </div>
      <div className="form-group">
        <label>Confirm New Password <span className="required">*</span></label>
        <PasswordInput value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required minLength={8} />
      </div>
      <button type="submit" className="lab-btn" disabled={loading}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
