'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { groupsApi, paymentsApi } from '@/lib/api';

interface GroupPreview {
  id: number;
  title: string;
  name?: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token: authToken } = useAuth();
  const groupToken = params.token as string;
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const verify = useCallback(async () => {
    if (!authToken || !sessionId) {
      setStatus('error');
      setErrorMsg('Missing authentication or session information.');
      return;
    }

    try {
      // Load group by token first to get group ID
      const group = await groupsApi.showByToken(groupToken) as GroupPreview;
      setGroupId(group.id);
      setGroupTitle(group.title || group.name || 'Takaful Group');

      // Verify the checkout session and complete join
      await paymentsApi.verifySession(authToken, group.id, sessionId);
      setStatus('success');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      // If already a member, still show success
      if (apiError.message === 'Already a member') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(apiError.message || 'Failed to verify payment.');
      }
    }
  }, [authToken, sessionId, groupToken]);

  useEffect(() => { verify(); }, [verify]);

  if (status === 'verifying') {
    return (
      <div className="main-container-wrapper">
        <div className="join-success-page">
          <div className="join-success-card">
            <div className="join-success-spinner">
              <div className="spinner" />
            </div>
            <h2 className="join-success-title">Verifying Payment</h2>
            <p className="join-success-text">Please wait while we confirm your payment and add you to the group...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="main-container-wrapper">
        <div className="join-success-page">
          <div className="join-success-card">
            <div className="join-success-icon join-success-icon-error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="join-success-title">Payment Issue</h2>
            <p className="join-success-text">{errorMsg}</p>
            <button className="lab-btn gradiant-greed-bg" onClick={() => router.push(`/join/${groupToken}`)} style={{ marginTop: 16 }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container-wrapper">
      <div className="join-success-page">
        <div className="join-success-card">
          <div className="join-success-icon join-success-icon-ok">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="join-success-title">Welcome to {groupTitle}!</h2>
          <p className="join-success-text">Your payment has been processed and you are now a member of this Takaful group.</p>
          <button className="lab-btn gradiant-greed-bg" onClick={() => router.push(`/groups/${groupId}`)} style={{ marginTop: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
            Go to Group Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
