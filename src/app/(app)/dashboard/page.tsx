'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EscorteDashboard from '@/components/dashboard/escorte-dashboard';
import ClientDashboard from '@/components/dashboard/client-dashboard';
import PartenaireDashboard from '@/components/dashboard/partenaire-dashboard';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/connexion');
    }
  }, [user, router]);

  const renderDashboard = () => {
    if (!user) {
      return (
        <div>
          <Skeleton className="h-8 w-1/4 mb-4" />
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
        return <EscorteDashboard />;
      case 'client':
        return <ClientDashboard />;
      case 'partenaire':
        return <PartenaireDashboard />;
      case 'administrateur':
        return <AdminDashboard />;
      default:
        return <p>Rôle non reconnu.</p>;
    }
  };

  return (
    <div>
      <PageHeader
        title={`Bienvenue, ${user?.name || '...'}`}
        description="Voici un aperçu de votre activité sur Élixir Sensuel."
      />
      {renderDashboard()}
    </div>
  );
}
