
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { EstablishmentPricingForm } from '@/components/features/settings/establishment-pricing-form';
import { CreatorPricingForm } from '@/components/features/settings/creator-pricing-form';

export default function GestionTarifsPage() {
    const { user, loading: authLoading } = useAuth();
    
    if (authLoading) {
        return <Skeleton className="h-96 w-full" />
    }
    
    if (!user) {
        return <PageHeader title="Accès non autorisé" description="Vous devez être connecté pour accéder à cette page." />;
    }

    if (user.role === 'partenaire' && user.partnerType === 'establishment') {
         return <EstablishmentPricingForm user={user} />;
    }
    
    if (user.role === 'escorte') {
        return <CreatorPricingForm user={user} />;
    }

    return <PageHeader title="Accès non autorisé" description="Cette page est réservée aux partenaires établissements et aux créateurs." />;
}
