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
  vote_stats: {
    total: number;
    approved: number;
    denied: number;
  };
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
  const { showToast } = useToast();

  const claimId = Number(params.id);

  const loadClaim = useCallback(async () => {
    if (!token) return;
    try {
      const data = await claimsApi.show(token, claimId) as ClaimDetail;
      setClaim(data);
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

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!claim) {
    return <EmptyState icon="not-found" message="Claim Not Found" subtitle="This claim may have been removed or you don't have access." />;
  }

  const statusClass = claim.status.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="main-container-wrapper">
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/groups/${claim.group_id}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold m-0">Claim Details</h2>
      </div>

      {/* Claimant Info */}
      <div className="claim-auth-info">
        {claim.claimant_image && (
          <div className="auth-info-img">
            <img src={claim.claimant_image} alt="claimant" />
          </div>
        )}
        <div className="basic-info">
          <div className="group">
            <div className="data-title">Name</div>
            <div className="data-content">{claim.claimant_name}</div>
          </div>
          <div className="group">
            <div className="data-title">Policy Number</div>
            <div className="data-content">{claim.policy_number}</div>
          </div>
          <div className="group">
            <div className="data-title">Status</div>
            <div className={`data-content status-content ${statusClass}`}>
              {claim.status}
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
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
                      <input type="radio" name="decision" value="approved" onChange={(e) => setVoteDecision(e.target.value)} required />
                      Approve
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="decision" value="denied" onChange={(e) => setVoteDecision(e.target.value)} required />
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
            <div className="result-title">Voting Result</div>
            <ul>
              <li><span>Total Participants: </span> {claim.vote_stats.total}</li>
              <li><span>Approved Votes: </span> {claim.vote_stats.approved}</li>
              <li><span>Denied Votes: </span> {claim.vote_stats.denied}</li>
            </ul>
          </div>
        )}
      </div>

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
              {claim.police_report_url && (
                <a href={claim.police_report_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-color)' }}>
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
