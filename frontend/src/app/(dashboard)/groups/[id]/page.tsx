'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { groupsApi, claimsApi } from '@/lib/api';
import SlidePanel from '@/components/layout/SlidePanel';
import Modal from '@/components/ui/Modal';
import InviteForm from '@/components/groups/InviteForm';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GroupDetail = Record<string, any>;

interface ClaimSummary {
  id: number;
  claimant_name: string;
  status: string;
  amount_claimed: string;
  title: string;
  policy_number: string;
  created_at?: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const { token, user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [claimsModalOpen, setClaimsModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [photosPreview, setPhotosPreview] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setter(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file) {
      setter(null);
    }
  };

  const groupId = Number(params.id);

  const loadGroup = useCallback(async () => {
    if (!token) return;
    try {
      const data = await groupsApi.show(token, groupId) as GroupDetail;
      setGroup(data);
      // Load claims separately
      try {
        const claimsData = await groupsApi.claims(token, groupId) as ClaimSummary[];
        setClaims(claimsData);
      } catch {
        // may not have access
      }
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

  const handleClaimSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !group) return;
    setClaimSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('group_id', String(group.id));
      await claimsApi.create(token, formData);
      showToast('Claim submitted successfully!');
      setClaimModalOpen(false);
      await loadGroup();
    } catch (err: unknown) {
      const apiError = err as { message?: string; errors?: Record<string, string[]> };
      let msg = 'Failed to submit claim.';
      if (apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];
        msg = firstError?.[0] || msg;
      } else if (apiError.message) {
        msg = apiError.message;
      }
      showToast(msg, 'error');
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!group) {
    return <EmptyState icon="not-found" message="Group Not Found" subtitle="This group may have been removed or you don't have access." />;
  }

  const groupTitle = group.title || group.name || 'Untitled Group';
  const isMember = group.is_member || group.active_members?.some((m: { id: number }) => m.id === user?.id) || group.creator_id === user?.id;

  const feeCards = [
    { no: '01', title: 'Joining Amount', value: `${group.amount_to_join} CAD`, icon: 'dollar' },
    { no: '02', title: 'Minimum Members', value: group.minimum_number_of_people || group.minimum_members || '-', icon: 'users' },
    { no: '03', title: 'Management Fee', value: `${group.management_fee} CAD`, icon: 'settings' },
    { no: '04', title: 'Claims Processing Fee', value: `${group.claims_processing_fee} CAD`, icon: 'briefcase' },
    { no: '05', title: 'Shariah-compliance Review Fee', value: `${group.shariah_compliance_review_fee} CAD`, icon: 'shield' },
    { no: '06', title: 'GetTakaful Platform Fee', value: `${group.gettakaful_platform_fee} CAD`, icon: 'grid' },
  ];

  const statsCards = isMember ? [
    { no: '07', title: 'Total Contributions', value: `${group.total_contributions} CAD`, icon: 'trending-up' },
    { no: '08', title: 'Total Claims Paid', value: `${group.total_claims_paid} CAD`, icon: 'credit-card' },
    { no: '09', title: 'Pool Balance', value: `${group.pool_balance} CAD`, icon: 'database' },
    { no: '10', title: 'Active Participants', value: group.active_members_count ?? group.number_of_active_participants ?? '-', icon: 'user-check' },
    { no: '11', title: 'Total Claims Submitted', value: group.claims_count ?? group.number_of_claims_submitted ?? claims.length, icon: 'file-text' },
  ] : [];

  const allCards = [...feeCards, ...statsCards];

  return (
    <div className="main-container-wrapper position-relative">
      {/* Header */}
      <div className="group-detail-header">
        <h1 className="text-xl font-semibold">{groupTitle}</h1>
        <div className="group-detail-actions">
          {isMember && (
            <button className="gda-btn gda-btn-outline" onClick={() => setMembersModalOpen(true)} title="View all members">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              All Members
            </button>
          )}
          {isMember && claims.length > 0 && (
            <button className="gda-btn gda-btn-outline" onClick={() => setClaimsModalOpen(true)} title="View all claims">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              All Claims
            </button>
          )}
          {isMember && (
            <button className="gda-btn gda-btn-outline" onClick={() => window.print()} title="Download as PDF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              PDF Download
            </button>
          )}
          <button className="gda-btn gda-btn-outline" onClick={() => setInvitePanelOpen(true)} title="Invite friends via email">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            Invite Friends
          </button>
          {!isMember && (
            <button className="gda-btn gda-btn-primary" onClick={handleJoin} disabled={joining}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              {joining ? 'Joining...' : 'Join Takaful'}
            </button>
          )}
          {isMember && (
            <button className="gda-btn gda-btn-primary" onClick={() => setClaimModalOpen(true)} title="Submit a new insurance claim">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              Claim Form
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="groups-data groups-data-container">
        <div className="row">
          {allCards.map((card) => (
            <div key={card.no} className="group-card">
              <span className="sl-no block">/ {card.no}</span>
              <div className="group-card-icon">
                <CardIcon type={card.icon} />
              </div>
              <div className="data-title">{card.title}</div>
              <div className="data-content">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Conditions */}
      {group.rules && (
        <div className="rules-contaienr">
          <h3 className="rules-title">Terms & Conditions</h3>
          <div className="rules-content" dangerouslySetInnerHTML={{ __html: group.rules }} />
        </div>
      )}

      {/* Claims Table */}
      {isMember && claims.length > 0 && (
        <div className="mt-5" id="claims-section">
          <h2 className="text-lg font-semibold mb-3">Claims</h2>
          <div className="dashboard-table-wrapper dashboard-common-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Claimant</th>
                  <th>Policy #</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="font-medium">{claim.title}</td>
                    <td>{claim.claimant_name}</td>
                    <td>{claim.policy_number}</td>
                    <td>{claim.amount_claimed} CAD</td>
                    <td>
                      <span className={`status-content ${claim.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/claims/${claim.id}`} className="lab-btn" style={{ fontSize: 12, padding: '3px 10px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
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

      <SlidePanel isOpen={invitePanelOpen} onClose={() => setInvitePanelOpen(false)} title={groupTitle} subtitle="Invite Friends">
        <InviteForm groupId={group.id} onSuccess={() => setInvitePanelOpen(false)} />
      </SlidePanel>

      {/* Members Modal */}
      <Modal isOpen={membersModalOpen} onClose={() => setMembersModalOpen(false)} title="Group Member" subtitle={groupTitle} size="xl">
        <div className="dashboard-table-wrapper dashboard-common-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle Make</th>
                <th>Vehicle Model</th>
                <th>Identification Number</th>
                <th>Registration Number</th>
                <th>Engine Size/Capacity</th>
              </tr>
            </thead>
            <tbody>
              {(group.active_members || []).map((m: { id: number; first_name: string; last_name: string; email?: string; pivot?: { vehicle_make?: string; vehicle_model?: string; identification_number?: string; registration_number?: string; engine_size_capacity?: string; role?: string } }) => (
                <tr key={m.id} className={m.pivot?.role === 'admin' ? 'tr-owner-group' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="member-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {m.first_name?.charAt(0)?.toUpperCase()}{m.last_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ fontSize: 13 }}>{m.first_name} {m.last_name}</div>
                        {m.email && <div style={{ fontSize: 11, color: 'var(--text-default-color)' }}>{m.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{m.pivot?.vehicle_make || '-'}</td>
                  <td>{m.pivot?.vehicle_model || '-'}</td>
                  <td>{m.pivot?.identification_number || '-'}</td>
                  <td>{m.pivot?.registration_number || '-'}</td>
                  <td>{m.pivot?.engine_size_capacity || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Claims Modal */}
      <Modal isOpen={claimsModalOpen} onClose={() => setClaimsModalOpen(false)} title="Group Claims" subtitle={groupTitle} size="lg">
        {claims.length === 0 ? (
          <p style={{ color: 'var(--text-default-color)', textAlign: 'center', padding: 20 }}>No claims submitted yet.</p>
        ) : (
          <div className="dashboard-table-wrapper dashboard-common-table">
            <table>
              <thead>
                <tr>
                  <th>Name of Member</th>
                  <th>Amount</th>
                  <th>Date of Claim</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim: ClaimSummary & { created_at?: string }) => (
                  <tr key={claim.id}>
                    <td className="font-medium">{claim.claimant_name}</td>
                    <td>{Number(claim.amount_claimed) > 0 ? claim.amount_claimed : ''}</td>
                    <td>{claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                    <td>
                      <span className={`status-content ${(claim.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <Link href={`/claims/${claim.id}`} style={{ color: '#9ca3af', display: 'inline-flex' }} title="View claim details">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Claim Form Modal */}
      <Modal isOpen={claimModalOpen} onClose={() => { setClaimModalOpen(false); setPhotosPreview(null); setReportPreview(null); setSignaturePreview(null); }} title="Insurance Claim Form" subtitle={groupTitle} size="xl">
        <form onSubmit={handleClaimSubmit} className="claim-form">
          <div className="claim-form-grid claim-form-3col">
            <div className="form-group">
              <label>Date of Incident <span className="required">*</span></label>
              <input type="date" name="date_of_incident" className="form-control" required />
            </div>
            <div className="form-group">
              <label>Time of Incident</label>
              <input type="time" name="time_of_incident" className="form-control" />
            </div>
            <div className="form-group">
              <label>Amount Claimed <span className="required">*</span></label>
              <input type="number" name="amount_claimed" className="form-control" step="0.01" min="0" placeholder="0.00" required />
            </div>
          </div>

          <div className="claim-form-grid claim-form-3col">
            <div className="form-group">
              <label>Location of Incident</label>
              <input type="text" name="location_of_incident" className="form-control" placeholder="City, Province" />
            </div>
            <div className="form-group">
              <label>Type of Incident</label>
              <input type="text" name="type_of_incident" className="form-control" placeholder="e.g. Collision, Theft" />
            </div>
            <div className="form-group">
              <label>Estimated Cost of Repairs</label>
              <input type="number" name="estimated_cost_of_repairs" className="form-control" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>

          <div className="claim-form-grid claim-form-2col">
            <div className="form-group">
              <label>Description of Incident</label>
              <textarea name="description_of_incident" className="form-control" rows={4} placeholder="Describe what happened..." />
            </div>
            <div className="form-group">
              <label>Damage Description</label>
              <textarea name="damage_description" className="form-control" rows={4} placeholder="Describe the damage..." />
            </div>
          </div>

          <div className="claim-form-grid claim-form-2col">
            <div className="form-group">
              <label>Vehicle Details</label>
              <textarea name="vehicle_details" className="form-control" rows={4} placeholder="Make, model, year, plate number..." />
            </div>
            <div className="form-group">
              <label>Witness Details</label>
              <textarea name="witness_details" className="form-control" rows={4} placeholder="Name, contact info of witnesses..." />
            </div>
          </div>

          <div className="form-group">
            <label>Bank Account Details</label>
            <input type="text" name="bank_account_details" className="form-control" placeholder="Bank name, account number, transit..." />
          </div>

          <div className="form-group">
            <label>Declaration</label>
            <input type="text" name="declaration" className="form-control" placeholder="I declare that the above information is true..." />
          </div>

          <input type="hidden" name="title" value={`Claim - ${new Date().toLocaleDateString()}`} />
          <input type="hidden" name="voting_days" value="7" />

          <div className="claim-form-grid claim-form-3col">
            <div className="form-group">
              <label>Photos of the Damage</label>
              <input type="file" name="photos_of_the_damage" className="form-control" accept="image/*" onChange={(e) => handleFilePreview(e, setPhotosPreview)} />
              {photosPreview && (
                <div className="file-preview-wrap">
                  <img src={photosPreview} alt="Photos preview" className="file-preview-img" />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Police Report File</label>
              <input type="file" name="police_report_file" className="form-control" accept=".pdf,image/*" onChange={(e) => handleFilePreview(e, setReportPreview)} />
              {reportPreview && (
                <div className="file-preview-wrap">
                  <img src={reportPreview} alt="Report preview" className="file-preview-img" />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Digital Signature</label>
              <input type="file" name="digital_signature" className="form-control" accept="image/*" onChange={(e) => handleFilePreview(e, setSignaturePreview)} />
              {signaturePreview && (
                <div className="file-preview-wrap">
                  <img src={signaturePreview} alt="Signature preview" className="file-preview-img" />
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="lab-btn gradiant-greed-bg" disabled={claimSubmitting} style={{ marginTop: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            {claimSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </Modal>

    </div>
  );
}

function CardIcon({ type }: { type: string }) {
  const color = 'var(--sidebar-nemu-active-color)';
  switch (type) {
    case 'dollar':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'users':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
    case 'settings':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
    case 'briefcase':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>;
    case 'shield':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'grid':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    case 'trending-up':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'credit-card':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
    case 'database':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
    case 'user-check':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
    case 'file-text':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    default:
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>;
  }
}
