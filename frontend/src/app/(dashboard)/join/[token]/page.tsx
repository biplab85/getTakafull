'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface GroupPreview {
  id: number;
  name: string;
  description: string;
  amount_to_join: number;
  minimum_members: number;
  creator_name: string;
}

export default function JoinByTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { token: authToken } = useAuth();
  const groupToken = params.token as string;
  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

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

  const handleJoin = async () => {
    if (!authToken || !group) return;
    setJoining(true);
    setError('');
    try {
      await groupsApi.join(authToken, group.id);
      showToast('Successfully joined the Takaful group!');
      router.push(`/groups/${group.id}`);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to join group.');
    } finally {
      setJoining(false);
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

  return (
    <div className="main-container-wrapper">
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h1 className="text-2xl font-semibold mb-2">Join Takaful</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-default-color)' }}>
          You&apos;ve been invited to join the following group.
        </p>

        <div className="group-card" style={{ textAlign: 'left', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{group.name}</h3>
          {group.description && <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>{group.description}</p>}
          <div style={{ fontSize: 14, color: 'var(--text-default-color)' }}>
            <p>Created by: {group.creator_name}</p>
            <p>Joining Amount: {group.amount_to_join} CAD</p>
            <p>Minimum Members: {group.minimum_members}</p>
          </div>
        </div>

        {error && <div className="login-error mb-3">{error}</div>}

        <button className="lab-btn gradiant-greed-bg" style={{ width: '100%' }} onClick={handleJoin} disabled={joining}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          {joining ? 'Joining...' : 'Join This Takaful'}
        </button>
      </div>
    </div>
  );
}
