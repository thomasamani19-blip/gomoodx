
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EscorteDashboard from '@/components/dashboard/escorte-dashboard';
import ClientDashboard from '@/components/dashboard/client-dashboard';
import PartenaireDashboard from '@/components/dashboard/partenaire-dashboard';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/connexion');
    }
  }, [user, loading, router]);

  const renderDashboard = () => {
    if (loading || !user) {
      return (
        <div>
          <Skeleton className="h-8 w-1/4 mb-4" />
           <Skeleton className="h-4 w-1/3 mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      );
    }

    switch (user.role) {
      case 'escorte':
        return <EscorteDashboard user={user} />;
      case 'client':
        return <ClientDashboard user={user} />;
      case 'partenaire':
        return <PartenaireDashboard user={user} />;
      case 'administrateur':
      case 'founder':
      case 'moderator':
        return <AdminDashboard user={user} />;
      default:
        // Fallback for any unexpected role, default to client view
        return <ClientDashboard user={user} />;
    }
  };

  return (
    <div>
      {renderDashboard()}
    </div>
  );
}
