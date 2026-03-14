'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { groupsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';

interface Group {
  id: number;
  name: string;
  amount_to_join: number;
  minimum_members: number;
  active_members_count: number;
  role: string;
}

export default function MyJoinedTakafulPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await groupsApi.joinedGroups(token) as Group[];
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
        <h1 className="text-xl font-semibold">All Takaful</h1>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="joined" message="No Takaful Groups Joined" subtitle="Browse available groups or use an invitation link to join one." />
      ) : (
        <div className="group-listing">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="group-list-card">
              <h3>{group.name}</h3>
              <div className="meta">
                <p>Joining: {group.amount_to_join} CAD</p>
                <p>Role: {group.role}</p>
                <p>Active: {group.active_members_count} members</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
