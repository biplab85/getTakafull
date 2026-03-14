'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import SlidePanel from '@/components/layout/SlidePanel';
import CreateGroupForm from '@/components/groups/CreateGroupForm';
import EmptyState from '@/components/ui/EmptyState';

interface Group {
  id: number;
  name: string;
  amount_to_join: number;
  minimum_members: number;
  active_members_count: number;
  created_at: string;
}

export default function MyTakafulPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await groupsApi.myGroups(token) as Group[];
      setGroups(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="main-container-wrapper">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">My Takaful</h1>
        <button className="lab-btn gradiant-greed-bg" onClick={() => setPanelOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create New Takaful
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="groups" message="No Takaful Groups Created" subtitle="Start your first Takaful group and invite members to join.">
          <button className="lab-btn" onClick={() => setPanelOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create your first Takaful
          </button>
        </EmptyState>
      ) : (
        <div className="group-listing">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="group-list-card">
              <h3>{group.name}</h3>
              <div className="meta">
                <p>Joining: {group.amount_to_join} CAD</p>
                <p>Min Members: {group.minimum_members}</p>
                <p>Active: {group.active_members_count} members</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="My Takaful" subtitle="New Entry">
        <CreateGroupForm onSuccess={() => { setPanelOpen(false); loadGroups(); }} />
      </SlidePanel>
    </div>
  );
}
