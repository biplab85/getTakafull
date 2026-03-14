'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import SlidePanel from '@/components/layout/SlidePanel';
import InviteForm from '@/components/groups/InviteForm';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface GroupDetail {
  id: number;
  name: string;
  description: string;
  group_token: string;
  amount_to_join: number;
  minimum_members: number;
  management_fee: number;
  claims_processing_fee: number;
  shariah_compliance_review_fee: number;
  platform_fee: number;
  total_contributions: number;
  total_claims_paid: number;
  pool_balance: number;
  active_members_count: number;
  total_claims_submitted: number;
  rules: string;
  is_member: boolean;
  creator_id: number;
  claims: ClaimSummary[];
}

interface ClaimSummary {
  id: number;
  claimant_name: string;
  status: string;
  amount_claimed: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const { token, user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const { showToast } = useToast();

  const groupId = Number(params.id);

  const loadGroup = useCallback(async () => {
    if (!token) return;
    try {
      const data = await groupsApi.show(token, groupId) as GroupDetail;
      setGroup(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, groupId]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  const handleJoin = async () => {
    if (!token || !group) return;
    setJoining(true);
    try {
      await groupsApi.join(token, group.id);
      showToast('Successfully joined the Takaful group!');
      await loadGroup();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast(apiError.message || 'Failed to join group.', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!group) {
    return <EmptyState icon="not-found" message="Group Not Found" subtitle="This group may have been removed or you don't have access." />;
  }

  const publicCards = [
    { no: '01', title: 'Joining Amount', value: `${group.amount_to_join} CAD` },
    { no: '02', title: 'Minimum Members', value: group.minimum_members },
    { no: '03', title: 'Management Fee', value: `${group.management_fee} CAD` },
    { no: '04', title: 'Claims Processing Fee', value: `${group.claims_processing_fee} CAD` },
    { no: '05', title: 'Shariah-compliance Review Fee', value: `${group.shariah_compliance_review_fee} CAD` },
    { no: '06', title: 'GetTakaful Platform Fee', value: `${group.platform_fee} CAD` },
  ];

  const memberCards = group.is_member ? [
    { no: '07', title: 'Total Contributions', value: `${group.total_contributions} CAD` },
    { no: '08', title: 'Total Claims Paid', value: `${group.total_claims_paid} CAD` },
    { no: '09', title: 'Pool Balance', value: `${group.pool_balance} CAD` },
    { no: '10', title: 'Active Participants', value: group.active_members_count },
    { no: '11', title: 'Total Claims Submitted', value: group.total_claims_submitted },
  ] : [];

  const allCards = [...publicCards, ...memberCards];
  const canClaim = group.is_member && user?.id !== group.creator_id;

  return (
    <div className="main-container-wrapper position-relative">
      <div className="flex flex-col lg:flex-row justify-between mb-5 gap-3">
        <h1 className="text-xl font-semibold">{group.name}</h1>
        <div className="flex flex-wrap gap-2">
          {group.is_member && (
            <button className="lab-btn" onClick={() => {
              const link = `${window.location.origin}/join/${group.group_token}`;
              navigator.clipboard.writeText(link);
              showToast('Join link copied to clipboard!', 'info');
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy Join Link
            </button>
          )}
          <button className="lab-btn" onClick={() => setInvitePanelOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            Invite Friends
          </button>
          {!group.is_member && (
            <button className="lab-btn" onClick={handleJoin} disabled={joining}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              {joining ? 'Joining...' : 'Join Takaful'}
            </button>
          )}
          {canClaim && (
            <Link href={`/groups/${group.id}#claim`} className="lab-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              Claim Form
            </Link>
          )}
        </div>
      </div>

      <div className="groups-data groups-data-container">
        <div className="row">
          {allCards.map((card) => (
            <div key={card.no} className="group-card">
              <span className="sl-no block">/ {card.no}</span>
              <div className="group-card-icon">
                <CardIcon index={parseInt(card.no)} />
              </div>
              <div className="data-title">{card.title}</div>
              <div className="data-content">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {group.rules && (
        <div className="rules-contaienr">
          <h3 className="rules-title">Terms & Conditions</h3>
          <div className="rules-content" dangerouslySetInnerHTML={{ __html: group.rules }} />
        </div>
      )}

      {group.is_member && group.claims && group.claims.length > 0 && (
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3">Claims</h2>
          <div className="dashboard-table-wrapper dashboard-common-table">
            <table>
              <thead>
                <tr>
                  <th>Claimant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.claimant_name}</td>
                    <td>{claim.amount_claimed} CAD</td>
                    <td>
                      <span className={`status-content ${claim.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/claims/${claim.id}`} className="lab-btn" style={{ fontSize: 12, padding: '3px 10px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlidePanel isOpen={invitePanelOpen} onClose={() => setInvitePanelOpen(false)} title={group.name} subtitle="Invite Friends">
        <InviteForm groupId={group.id} onSuccess={() => setInvitePanelOpen(false)} />
      </SlidePanel>
    </div>
  );
}

function CardIcon({ index }: { index: number }) {
  const color = 'var(--sidebar-nemu-active-color)';
  const icons: Record<number, React.ReactNode> = {
    1: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    2: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
    3: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
    4: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>,
    5: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    6: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  };
  return <>{icons[index] || icons[1]}</>;
}
