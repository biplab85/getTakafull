'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
