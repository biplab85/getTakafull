'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const menuItems = [
  { slug: 'dashboard', title: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { slug: 'my-takaful', title: 'My Takaful', href: '/my-takaful', icon: MyTakafulIcon },
  { slug: 'my-joined-takaful', title: 'All Takaful', href: '/my-joined-takaful', icon: JoinedIcon },
  { slug: 'blog', title: 'Blog', href: 'https://gettakaful.ca/blog/', external: true, icon: BlogIcon },
  { slug: 'homepage', title: 'Homepage', href: 'https://gettakaful.ca/', external: true, icon: HomeIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="left-sidebar-menu">
        <div>
          {/* Logo */}
          <div className="vertical-sidebar">
            <div className="app-logo">
              <div className="logo-img">
                <img className="expand-logo" src="/img/logo.png" alt="GetTakaful" />
                <img className="minimize-logo" src="/img/icon.png" alt="GT" />
              </div>
              <button id="header-toggle" className="sidebar-toggle-btn" onClick={onToggle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="mobile-sidebar-close lg:hidden" onClick={onMobileClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="simplebar-content">
            <ul className="main-nav dashboard-leftaside-menubar">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                if (item.external) {
                  return (
                    <li key={item.slug} className={`menu-title icon-${index + 1}`}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <Icon active={false} />
                        <span className={`text ${collapsed ? 'collapsed' : ''}`}>{item.title}</span>
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.slug} className={`menu-title icon-${index + 1} ${isActive ? 'active' : ''}`}>
                    <Link href={item.href}>
                      <Icon active={isActive} />
                      <span className={`text ${collapsed ? 'collapsed' : ''}`}>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* User Profile */}
        <SidebarUserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}

function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="sidebar-user-wrap" ref={ref}>
      {/* Popover - floats above the trigger */}
      {open && (
        <div className="sidebar-user-popover">
          <Link href="/account-settings" className="sidebar-popover-item" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Account Settings
          </Link>
          <button className="sidebar-popover-item logout" onClick={logout} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      )}

      {/* Trigger */}
      <div className="account-setting-card">
        <div className="sidebar-user-card" onClick={() => setOpen(!open)} role="button" tabIndex={0}>
          <div className="sidebar-user-avatar">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="profile" />
            ) : (
              <span>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
            <div className="sidebar-user-status" />
          </div>
          <div className={`sidebar-user-info ${collapsed ? 'collapsed' : ''}`}>
            <h5>{user?.full_name}</h5>
            <p>{user?.email}</p>
          </div>
          <div className={`sidebar-user-arrow ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// SVG Icon Components
function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'var(--sidebar-nemu-active-color)' : 'none'} stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function MyTakafulIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function JoinedIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function BlogIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--sidebar-nemu-active-color)' : 'var(--sidebar-nemu-color)'} strokeWidth="2">
      <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
