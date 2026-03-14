'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="body-content">
      <Header onMobileToggle={() => setMobileOpen(!mobileOpen)} />
      <div className="dashboard-container">
        <div className={mobileOpen ? 'mobile-sidebar-open' : ''}>
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            onMobileClose={() => setMobileOpen(false)}
          />
        </div>
        <main className={`dashboard-main ${collapsed ? 'expanded' : ''}`}>
          {children}
        </main>
      </div>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
}
