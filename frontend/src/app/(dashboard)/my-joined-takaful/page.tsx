"use client";

import EmptyState from "@/components/ui/EmptyState";
import { groupsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";


interface Group {
  id: number;
  title: string;
  name: string;
  amount_to_join: number;
  minimum_number_of_people: number;
  minimum_members: number;
  active_members_count: number;
  status: string;
  creator_id: number;
  pivot?: { role: string };
  role: string;
  created_at: string;
}

export default function MyJoinedTakafulPage() {
  const { token, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const loadGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = (await groupsApi.joinedGroups(token)) as Group[];
      setGroups(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const getGroupName = (g: Group) => g.title || g.name;
  const getMinMembers = (g: Group) =>
    g.minimum_number_of_people || g.minimum_members || 0;
  const getRole = (g: Group) => g.pivot?.role || g.role || "member";
  const isOwner = (g: Group) => g.creator_id === user?.id || g.pivot?.role === "admin";

  return (
    <div className="main-container-wrapper">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">All Takaful</h1>
        {groups.length > 0 && (
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon="joined"
          message="No Takaful Groups Joined"
          subtitle="Browse available groups or use an invitation link to join one."
        />
      ) : viewMode === "grid" ? (
        <div className="group-listing">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className={`group-list-card ${isOwner(group) ? "tr-owner-group" : ""}`}
            >
              <div className="group-card-header">
                <div className="group-card-icon-wrap" title="Takaful Group">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className={`group-status-badge ${group.status || "active"}`}>
                  {group.status || "active"}
                </span>
              </div>
              <h3 className="group-card-title">{getGroupName(group)}</h3>
              <div className="flex items-center justify-between mb-3">
                <div className="group-card-stat" title="Minimum Members Required">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  <span>Min: {getMinMembers(group)}</span>
                </div>
                <div className="group-card-stat" title="Active Members">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{group.active_members_count} members</span>
                </div>
              </div>
              <div className="group-card-stats">
                <div className="group-card-stat" title="Joining Amount">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{group.amount_to_join} CAD</span>
                </div>
                <div className="group-card-stat" title="Your Role">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="capitalize">{getRole(group)}</span>
                </div>
              </div>
              <div className="group-card-view-btn" title="View group details">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                View Details
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="dashboard-table-wrapper dashboard-common-table">
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Joining Amount</th>
                <th>Min Members</th>
                <th>Active Members</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className={isOwner(group) ? "tr-owner-group" : ""}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="group-table-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <span className="font-medium">{getGroupName(group)}</span>
                    </div>
                  </td>
                  <td>{group.amount_to_join} CAD</td>
                  <td>{getMinMembers(group)}</td>
                  <td>{group.active_members_count}</td>
                  <td>
                    <span className="group-status-badge" style={{ background: "#f5f3ff", color: "#7c3aed", textTransform: "capitalize" }}>
                      {getRole(group)}
                    </span>
                  </td>
                  <td>
                    <span className={`group-status-badge ${group.status || "active"}`}>
                      {group.status || "active"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/groups/${group.id}`}
                      className="lab-btn"
                      style={{ padding: "5px 12px", fontSize: 13 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
