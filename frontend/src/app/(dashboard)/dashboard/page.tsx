'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/api';
import SlidePanel from '@/components/layout/SlidePanel';
import CreateGroupForm from '@/components/groups/CreateGroupForm';
import EmptyState from '@/components/ui/EmptyState';

interface DashboardStats {
  my_groups: number;
  joined_groups: number;
  pending_claims: number;
  total_claim_amount: number;
}

interface PendingVote {
  id: number;
  group_name: string;
  claimant_name: string;
  amount_claimed: string;
  voting_deadline: string;
}

interface RecentClaim {
  id: number;
  group_name: string;
  policy_number: string;
  status: string;
  amount_claimed: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([]);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [votesCollapsed, setVotesCollapsed] = useState(false);
  const [claimsCollapsed, setClaimsCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [s, v, c] = await Promise.all([
        dashboardApi.stats(token) as Promise<DashboardStats>,
        dashboardApi.pendingVotes(token) as Promise<PendingVote[]>,
        dashboardApi.recentClaims(token) as Promise<RecentClaim[]>,
      ]);
      setStats(s);
      setPendingVotes(v);
      setRecentClaims(c);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const statCards = [
    { label: 'My Takaful', value: stats?.my_groups ?? 0, theme: 'blue' as const, icon: GroupIcon },
    { label: 'Total Joined Takaful', value: stats?.joined_groups ?? 0, theme: 'green' as const, icon: JoinedGroupIcon },
    { label: 'Pending Claims', value: stats?.pending_claims ?? 0, theme: 'orange' as const, icon: PendingIcon },
    { label: 'Total Claim Amount', value: `${stats?.total_claim_amount ?? 0} CAD`, theme: 'indigo' as const, icon: AmountIcon },
  ];

  return (
    <div className="dashboard-overview main-container-wrapper">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="overview-page-title">
          <h2 className="sub-title">Welcome back, {user?.full_name}</h2>
          <h1 className="title">Dashboard overview</h1>
        </div>
        <button className="lab-btn gradiant-greed-bg" onClick={() => setPanelOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create New Takaful
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, i) => (
            <div key={i} className={`dashboard-card card-theme-${card.theme}`}>
              <div className="card-top-row">
                <div className="card-icon">
                  <card.icon />
                </div>
                <div className="card-accent-dot" />
              </div>
              <div className="card-body">
                <h4 className="total-number">{card.value}</h4>
                <p className="card-subtext">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mt-5">
        {/* Pending Votes */}
        <div className={`dashboard-table-wrapper collapsible-data-container dashboard-common-table flex-1 ${votesCollapsed ? 'content-collapse' : ''}`}>
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h2 className="text-base font-medium m-0">Pending votes</h2>
            {pendingVotes.length > 0 && (
              <button className={`table-toggle ${votesCollapsed ? '' : 'collapseToggle'}`} onClick={() => setVotesCollapsed(!votesCollapsed)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            )}
          </div>
          <div className="collapsible-content-wrapper">
            {pendingVotes.length === 0 ? (
              <EmptyState icon="votes" message="No Pending Votes" subtitle="When a claim needs your vote, it will appear here." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Claimant</th>
                    <th>Amount</th>
                    <th>Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVotes.map((vote) => (
                    <tr key={vote.id}>
                      <td>{vote.group_name}</td>
                      <td>{vote.claimant_name}</td>
                      <td>{vote.amount_claimed} CAD</td>
                      <td>{new Date(vote.voting_deadline).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/claims/${vote.id}`} className="lab-btn" style={{ fontSize: 12, padding: '3px 10px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                          Vote
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Claims */}
        <div className={`dashboard-table-wrapper collapsible-data-container dashboard-common-table flex-1 ${claimsCollapsed ? 'content-collapse' : ''}`}>
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h2 className="text-base font-medium m-0">Recent claim status</h2>
            {recentClaims.length > 0 && (
              <button className={`table-toggle ${claimsCollapsed ? '' : 'collapseToggle'}`} onClick={() => setClaimsCollapsed(!claimsCollapsed)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            )}
          </div>
          <div className="collapsible-content-wrapper">
            {recentClaims.length === 0 ? (
              <EmptyState icon="claims" message="No Recent Claims" subtitle="Claims submitted by group members will show up here." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Policy #</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>{claim.group_name}</td>
                      <td>{claim.policy_number}</td>
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
            )}
          </div>
        </div>
      </div>

      <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Dashboard" subtitle="New Entry">
        <CreateGroupForm onSuccess={() => { setPanelOpen(false); loadData(); }} />
      </SlidePanel>
    </div>
  );
}

function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function JoinedGroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function AmountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
