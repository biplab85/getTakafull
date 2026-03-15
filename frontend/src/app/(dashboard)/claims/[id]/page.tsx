'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { claimsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface ClaimDetail {
  id: number;
  group_id: number;
  group_name: string;
  claimant_name: string;
  claimant_image: string | null;
  policy_number: string;
  status: string;
  date_of_incident: string;
  time_of_incident: string;
  amount_claimed: string;
  location_of_incident: string;
  type_of_incident: string;
  estimated_cost_of_repairs: string;
  description_of_incident: string;
  damage_description: string;
  vehicle_details: string;
  witness_details: string;
  bank_account_details: string;
  declaration: string;
  photos_url: string | null;
  police_report_url: string | null;
  signature_url: string | null;
  voting_deadline: string;
  is_voting_open: boolean;
  has_voted: boolean;
  can_vote: boolean;
  is_owner: boolean;
  can_review: boolean;
  owner_review_reason: string | null;
  vote_stats?: {
    total: number;
    approved: number;
    denied: number;
  };
  total_participants?: number;
  approved_votes?: number;
  denied_votes?: number;
  eligible_voters?: number;
  approval_percentage?: number;
  approval_threshold?: number;
  group?: { id: number; title: string };
  claimant?: { id: number; first_name: string; last_name: string; profile_picture?: string };
  report_url?: string | null;
}

export default function ClaimDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteDecision, setVoteDecision] = useState('');
  const [voteComment, setVoteComment] = useState('');
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const { showToast } = useToast();

  const claimId = Number(params.id);

  const loadClaim = useCallback(async () => {
    if (!token) return;
    try {
      const res = await claimsApi.show(token, claimId) as { claim: ClaimDetail; voting: Record<string, unknown> } | ClaimDetail;
      // API returns { claim, voting } -- extract the claim object
      if ('claim' in res && res.claim) {
        const merged = { ...res.claim, ...(res.voting as Record<string, unknown>) } as unknown as ClaimDetail;
        setClaim(merged);
      } else {
        setClaim(res as ClaimDetail);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, claimId]);

  useEffect(() => { loadClaim(); }, [loadClaim]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !claim) return;
    setVoteError('');
    setVoting(true);
    try {
      await claimsApi.vote(token, claim.id, { decision: voteDecision, comment: voteComment });
      showToast('Vote submitted successfully.');
      await loadClaim();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setVoteError(apiError.message || 'Failed to submit vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !claim) return;
    setReviewError('');
    setReviewing(true);
    try {
      await claimsApi.review(token, claim.id, {
        decision: reviewDecision,
        reason: reviewDecision === 'reject' ? reviewReason : undefined,
      });
      showToast(reviewDecision === 'approve' ? 'Claim approved. Voting emails sent to members.' : 'Claim rejected.');
      await loadClaim();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setReviewError(apiError.message || 'Failed to submit review.');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!claim) {
    return <EmptyState icon="not-found" message="Claim Not Found" subtitle="This claim may have been removed or you don't have access." />;
  }

  const statusClass = (claim.status || 'pending').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="main-container-wrapper">
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/groups/${claim.group_id || claim.group?.id}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold m-0">Claim Details</h2>
      </div>

      {/* Claimant Info */}
      <div className="claim-auth-info">
        {(claim.claimant_image || claim.claimant?.profile_picture) ? (
          <div className="auth-info-img">
            <img src={(() => {
              const pic = claim.claimant_image || claim.claimant?.profile_picture || '';
              if (pic.startsWith('http')) return pic;
              return `http://localhost:8000/storage/${pic}`;
            })()} alt="claimant" />
          </div>
        ) : (
          <div className="auth-info-img" style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #e0f7f5, #ccfbf1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: 'var(--sidebar-nemu-active-color)' }}>
            {(claim.claimant_name || claim.claimant?.first_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="basic-info">
          <div className="group">
            <div className="data-title">Name</div>
            <div className="data-content">{claim.claimant_name || (claim.claimant ? `${claim.claimant.first_name} ${claim.claimant.last_name}` : '-')}</div>
          </div>
          <div className="group">
            <div className="data-title">Policy Number</div>
            <div className="data-content">{claim.policy_number}</div>
          </div>
          <div className="group">
            <div className="data-title">Status</div>
            <div className={`data-content status-content ${statusClass}`}>
              {claim.status === 'owner_approved' ? 'Voting in Progress' : claim.status}
            </div>
          </div>
        </div>
      </div>

      {/* Owner Review Section - Only for pending claims when user is group owner */}
      {claim.can_review && (
        <div className="voting-content-wrapper">
          <div className="vote-result">
            <b>Owner Review</b>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-default-color)' }}>
              As the group owner, please review this claim and decide whether to approve it for member voting or reject it.
            </p>
            <form onSubmit={handleReview} className="mt-3">
              {reviewError && <div className="login-error mb-3">{reviewError}</div>}
              <div className="form-group">
                <label>Your Decision</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="review_decision" value="approve" onChange={(e) => setReviewDecision(e.target.value)} required />
                    Approve for Voting
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="review_decision" value="reject" onChange={(e) => setReviewDecision(e.target.value)} required />
                    Reject
                  </label>
                </div>
              </div>
              {reviewDecision === 'reject' && (
                <div className="form-group">
                  <label>Reason for Rejection <span style={{ color: '#e74c3c' }}>*</span></label>
                  <textarea className="form-control" value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} rows={3} required placeholder="Please provide a reason..." />
                </div>
              )}
              <button type="submit" className="lab-btn" disabled={reviewing}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                {reviewing ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rejected reason */}
      {claim.status === 'rejected' && claim.owner_review_reason && (
        <div className="voting-content-wrapper">
          <div className="vote-result">
            <div className="result-title">Claim Rejected by Owner</div>
            <p className="mt-2" style={{ color: '#e74c3c' }}>{claim.owner_review_reason}</p>
          </div>
        </div>
      )}

      {/* Pending owner review notice (for non-owners) */}
      {claim.status === 'pending' && !claim.can_review && (
        <div className="voting-content-wrapper">
          <div className="vote-result">
            <b>Awaiting Owner Review</b>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-default-color)' }}>
              This claim is pending review by the group owner. Voting will begin once the owner approves.
            </p>
          </div>
        </div>
      )}

      {/* Voting Section - Only for owner_approved claims */}
      {claim.status === 'owner_approved' && (
        <div className="voting-content-wrapper">
          {claim.is_voting_open ? (
            <div className="vote-result">
              <b>Claim Approval Voting</b>
              {claim.can_vote && !claim.has_voted ? (
                <form onSubmit={handleVote} className="mt-3">
                  {voteError && <div className="login-error mb-3">{voteError}</div>}
                  <div className="form-group">
                    <label>Your Decision</label>
                    <div className="flex gap-3 mt-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="decision" value="approve" onChange={(e) => setVoteDecision(e.target.value)} required />
                        Approve
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="decision" value="deny" onChange={(e) => setVoteDecision(e.target.value)} required />
                        Deny
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comment (optional)</label>
                    <textarea className="form-control" value={voteComment} onChange={(e) => setVoteComment(e.target.value)} rows={3} />
                  </div>
                  <button type="submit" className="lab-btn" disabled={voting}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                    {voting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </form>
              ) : claim.has_voted ? (
                <h6 className="mt-3">You have already participated in the voting process.</h6>
              ) : (
                <h6 className="mt-3">You are unable to participate in the voting process.</h6>
              )}
              <div className="mt-2 text-sm" style={{ color: 'var(--text-default-color)' }}>
                Voting deadline: {new Date(claim.voting_deadline).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="vote-result">
              <div className="result-title">Voting Closed</div>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-default-color)' }}>
                The voting period has ended.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Voting Result - Always visible when there are votes */}
      {(claim.total_participants ?? 0) > 0 && (
        <VotingResultChart
          totalParticipants={claim.vote_stats?.total ?? claim.total_participants ?? 0}
          approvedVotes={claim.vote_stats?.approved ?? claim.approved_votes ?? 0}
          deniedVotes={claim.vote_stats?.denied ?? claim.denied_votes ?? 0}
          eligibleVoters={claim.eligible_voters ?? 0}
          approvalPercentage={claim.approval_percentage ?? 0}
          threshold={claim.approval_threshold ?? 70}
          status={claim.status}
        />
      )}

      {/* Incident Details */}
      <div className="groups-data-content-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <div className="data-title">Date of Incident</div>
            <div className="data-content">{claim.date_of_incident}</div>
          </div>
          <div>
            <div className="data-title">Time of Incident</div>
            <div className="data-content">{claim.time_of_incident}</div>
          </div>
          <div>
            <div className="data-title">Amount Claimed</div>
            <div className="data-content">{claim.amount_claimed} CAD</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <div className="data-title">Location of Incident</div>
            <div className="data-content">{claim.location_of_incident}</div>
          </div>
          <div>
            <div className="data-title">Type of Incident</div>
            <div className="data-content">{claim.type_of_incident}</div>
          </div>
          <div>
            <div className="data-title">Estimated Cost of Repairs</div>
            <div className="data-content">{claim.estimated_cost_of_repairs}</div>
          </div>
        </div>
        <div className="mb-5">
          <div className="data-title">Description of Incident</div>
          <div className="data-content">{claim.description_of_incident}</div>
        </div>
        <div className="mb-5">
          <div className="data-title">Damage Description</div>
          <div className="data-content">{claim.damage_description}</div>
        </div>
        <div className="mb-5">
          <div className="data-title">Vehicle Details</div>
          <div className="data-content">{claim.vehicle_details}</div>
        </div>
        <div className="mb-5">
          <div className="data-title">Witness Details</div>
          <div className="data-content">{claim.witness_details}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <div className="data-title">Bank Account Details</div>
            <div className="data-content">{claim.bank_account_details}</div>
          </div>
          <div>
            <div className="data-title">Declaration</div>
            <div className="data-content">{claim.declaration}</div>
          </div>
        </div>

        {/* Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="data-title">Photos of the Damage</div>
            <div className="data-content">
              {claim.photos_url && (
                <a href={claim.photos_url} target="_blank" rel="noopener noreferrer">
                  <img src={claim.photos_url} width={80} alt="damage" style={{ borderRadius: 4 }} />
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="data-title">Police Report File</div>
            <div className="data-content">
              {(claim.police_report_url || claim.report_url) && (
                <a href={claim.police_report_url || claim.report_url || ''} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-color)' }}>
                  Download
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="data-title">Digital Signature</div>
            <div className="data-content">
              {claim.signature_url && (
                <a href={claim.signature_url} target="_blank" rel="noopener noreferrer">
                  <img src={claim.signature_url} width={80} alt="signature" style={{ borderRadius: 4 }} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VotingResultChart({ totalParticipants, approvedVotes, deniedVotes, eligibleVoters, approvalPercentage, threshold, status }: {
  totalParticipants: number;
  approvedVotes: number;
  deniedVotes: number;
  eligibleVoters: number;
  approvalPercentage: number;
  threshold: number;
  status: string;
}) {
  const notVoted = Math.max(eligibleVoters - totalParticipants, 0);
  const thresholdMet = approvalPercentage >= threshold;

  // Donut chart SVG values
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const approvedPct = eligibleVoters > 0 ? (approvedVotes / eligibleVoters) * 100 : 0;
  const deniedPct = eligibleVoters > 0 ? (deniedVotes / eligibleVoters) * 100 : 0;
  const notVotedPct = eligibleVoters > 0 ? (notVoted / eligibleVoters) * 100 : 0;

  const approvedLen = (approvedPct / 100) * circumference;
  const deniedLen = (deniedPct / 100) * circumference;
  const notVotedLen = (notVotedPct / 100) * circumference;

  const approvedOffset = 0;
  const deniedOffset = -(approvedLen);
  const notVotedOffset = -(approvedLen + deniedLen);

  return (
    <div className="voting-content-wrapper">
      <div className="vote-result">
        <div className="result-title">Voting Result</div>

        <div className="vr-chart-wrapper">
          {/* Donut Chart */}
          <div className="vr-chart">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background track */}
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
              {/* Not voted arc */}
              {notVotedPct > 0 && (
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}
                  strokeDasharray={`${notVotedLen} ${circumference - notVotedLen}`}
                  strokeDashoffset={notVotedOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
              )}
              {/* Denied arc */}
              {deniedPct > 0 && (
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f87171" strokeWidth={strokeWidth}
                  strokeDasharray={`${deniedLen} ${circumference - deniedLen}`}
                  strokeDashoffset={deniedOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
              )}
              {/* Approved arc */}
              {approvedPct > 0 && (
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#04b0a0" strokeWidth={strokeWidth}
                  strokeDasharray={`${approvedLen} ${circumference - approvedLen}`}
                  strokeDashoffset={approvedOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
              )}
              {/* Threshold marker line */}
              {eligibleVoters > 0 && (() => {
                const angle = ((threshold / 100) * 360) - 90;
                const rad = (angle * Math.PI) / 180;
                const x1 = size / 2 + (radius - strokeWidth / 2 - 2) * Math.cos(rad);
                const y1 = size / 2 + (radius - strokeWidth / 2 - 2) * Math.sin(rad);
                const x2 = size / 2 + (radius + strokeWidth / 2 + 2) * Math.cos(rad);
                const y2 = size / 2 + (radius + strokeWidth / 2 + 2) * Math.sin(rad);
                return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="2" strokeLinecap="round" />;
              })()}
            </svg>
            <div className="vr-chart-center">
              <span className="vr-chart-pct">{Math.round(approvalPercentage)}%</span>
              <span className="vr-chart-label">Approved</span>
            </div>
          </div>

          {/* Stats */}
          <div className="vr-stats">
            <div className="vr-stat-row">
              <span className="vr-stat-dot" style={{ background: '#04b0a0' }} />
              <span className="vr-stat-label">Approved</span>
              <span className="vr-stat-value">{approvedVotes}</span>
              <span className="vr-stat-pct">{Math.round(approvedPct)}%</span>
            </div>
            <div className="vr-stat-row">
              <span className="vr-stat-dot" style={{ background: '#f87171' }} />
              <span className="vr-stat-label">Denied</span>
              <span className="vr-stat-value">{deniedVotes}</span>
              <span className="vr-stat-pct">{Math.round(deniedPct)}%</span>
            </div>
            <div className="vr-stat-row">
              <span className="vr-stat-dot" style={{ background: '#e2e8f0' }} />
              <span className="vr-stat-label">Not Voted</span>
              <span className="vr-stat-value">{notVoted}</span>
              <span className="vr-stat-pct">{Math.round(notVotedPct)}%</span>
            </div>
            <div className="vr-stat-divider" />
            <div className="vr-stat-row">
              <span className="vr-stat-dot" style={{ background: 'transparent', border: '2px solid #94a3b8' }} />
              <span className="vr-stat-label">Total Participants</span>
              <span className="vr-stat-value">{totalParticipants} / {eligibleVoters}</span>
            </div>
          </div>
        </div>

        {/* Threshold bar */}
        <div className="vr-threshold">
          <div className="vr-threshold-header">
            <span>Approval Threshold: {threshold}%</span>
            <span className={`vr-threshold-badge ${thresholdMet ? 'vr-badge-met' : 'vr-badge-not-met'}`}>
              {status === 'approved' ? 'Claim Approved' : thresholdMet ? 'Threshold Met' : 'Threshold Not Met'}
            </span>
          </div>
          <div className="vr-threshold-bar">
            <div className="vr-threshold-fill" style={{ width: `${Math.min(approvalPercentage, 100)}%` }} />
            <div className="vr-threshold-marker" style={{ left: `${threshold}%` }} />
          </div>
          <div className="vr-threshold-labels">
            <span>0%</span>
            <span>{threshold}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
