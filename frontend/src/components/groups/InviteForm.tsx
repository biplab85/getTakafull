'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface InviteFormProps {
  groupId: number;
  onSuccess: () => void;
}

export default function InviteForm({ groupId, onSuccess }: InviteFormProps) {
  const { token } = useAuth();
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');
    setLoading(true);

    const emailList = emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);

    if (emailList.length === 0) {
      setError('Please enter at least one email.');
      setLoading(false);
      return;
    }

    try {
      await groupsApi.invite(token, groupId, emailList);
      setSuccess('Invitations sent successfully!');
      showToast('Invitations sent successfully!');
      setEmails('');
      onSuccess();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      const msg = apiError.message || 'Failed to send invitations.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="success-message" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="form-group">
        <label>Email Addresses</label>
        <textarea
          className="form-control"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="Enter emails separated by commas or new lines"
          rows={5}
          required
        />
      </div>
      <button type="submit" className="lab-btn" disabled={loading}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>
        {loading ? 'Sending...' : 'Send Invitations'}
      </button>
    </form>
  );
}
