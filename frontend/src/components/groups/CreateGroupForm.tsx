'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useToast } from '@/components/ui/Toast';

interface CreateGroupFormProps {
  onSuccess: () => void;
}

export default function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    description: '',
    amount_to_join: '',
    minimum_members: '',
    management_fee: '',
    claims_processing_fee: '',
    shariah_compliance_review_fee: '',
    platform_fee: '',
    rules: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      await groupsApi.create(token, {
        ...form,
        amount_to_join: parseFloat(form.amount_to_join),
        minimum_members: parseInt(form.minimum_members),
        management_fee: parseFloat(form.management_fee || '0'),
        claims_processing_fee: parseFloat(form.claims_processing_fee || '0'),
        shariah_compliance_review_fee: parseFloat(form.shariah_compliance_review_fee || '0'),
        platform_fee: parseFloat(form.platform_fee || '0'),
      });
      showToast('Takaful group created successfully!');
      onSuccess();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to create group.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="form-group">
        <label>Takaful Name <span style={{ color: '#e74c3c' }}>*</span></label>
        <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <RichTextEditor value={form.description} onChange={(val) => setForm({ ...form, description: val })} placeholder="Enter description..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label>Joining Amount (CAD) <span style={{ color: '#e74c3c' }}>*</span></label>
          <input type="number" name="amount_to_join" className="form-control" value={form.amount_to_join} onChange={handleChange} required min="0" step="0.01" />
        </div>
        <div className="form-group">
          <label>Minimum Members <span style={{ color: '#e74c3c' }}>*</span></label>
          <input type="number" name="minimum_members" className="form-control" value={form.minimum_members} onChange={handleChange} required min="2" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label>Management Fee (CAD)</label>
          <input type="number" name="management_fee" className="form-control" value={form.management_fee} onChange={handleChange} min="0" step="0.01" />
        </div>
        <div className="form-group">
          <label>Claims Processing Fee (CAD)</label>
          <input type="number" name="claims_processing_fee" className="form-control" value={form.claims_processing_fee} onChange={handleChange} min="0" step="0.01" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label>Shariah Review Fee (CAD)</label>
          <input type="number" name="shariah_compliance_review_fee" className="form-control" value={form.shariah_compliance_review_fee} onChange={handleChange} min="0" step="0.01" />
        </div>
        <div className="form-group">
          <label>Platform Fee (CAD)</label>
          <input type="number" name="platform_fee" className="form-control" value={form.platform_fee} onChange={handleChange} min="0" step="0.01" />
        </div>
      </div>
      <div className="form-group">
        <label>Terms & Conditions</label>
        <RichTextEditor value={form.rules} onChange={(val) => setForm({ ...form, rules: val })} placeholder="Enter terms and conditions..." />
      </div>
      <button type="submit" className="lab-btn" disabled={loading}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {loading ? 'Creating...' : 'Create Takaful'}
      </button>
    </form>
  );
}
