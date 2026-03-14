'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onMobileToggle: () => void;
}

export default function Header({ onMobileToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const slug = segments[0] || 'dashboard';
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      'my-takaful': 'My Takaful',
      'my-joined-takaful': 'All Takaful',
      'account-settings': 'Account Settings',
      groups: 'Group Details',
      claims: 'Claim Details',
      join: 'Join Takaful',
    };
    return titles[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="header-main">
      <div className="page-title">
        <button className="mobile-sidebar-toggle lg:hidden" onClick={onMobileToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div>
          <PageIcon pathname={pathname} />
        </div>
        <div className="text">{getPageTitle()}</div>
      </div>
      <div className="header-right">
        <div className="user-profile" ref={dropdownRef}>
          <button
            className="header-user-trigger"
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
          >
            <div className="header-user-avatar">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="profile" />
              ) : (
                <span>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <span className="header-user-name">{user?.full_name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`header-user-chevron ${dropdownOpen ? 'open' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="profile-dropdown-canvas show">
              <div className="text-center">
                {user?.profile_picture && (
                  <img className="profile-img mb-2" src={user.profile_picture} alt="profile" />
                )}
                <h4 className="text-lg text-gray-800 mb-0">{user?.full_name}</h4>
                <h5 className="text-sm text-gray-500 font-normal">{user?.email}</h5>
              </div>
              <div className="profile-option">
                <Link href="/account-settings" className="text-sm text-gray-500 font-normal flex items-center gap-2" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Account settings
                </Link>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="text-sm logout-btn flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageIcon({ pathname }: { pathname: string }) {
  const slug = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const color = 'var(--sidebar-nemu-color)';

  switch (slug) {
    case 'dashboard':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'account-settings':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}
