
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { EstablishmentPricingForm } from '@/components/features/settings/establishment-pricing-form';
import { CreatorPricingForm } from '@/components/features/settings/creator-pricing-form';
import { useRouter } from 'next/navigation';

export default function GestionTarifsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    if (authLoading) {
        return <Skeleton className="h-96 w-full" />;
    }
    
    if (!user) {
        router.push('/connexion');
        return null;
    }

    if (user.role === 'partenaire' && user.partnerType === 'establishment') {
         return <EstablishmentPricingForm user={user} />;
    }
    
    if (user.role === 'escorte') {
        return <CreatorPricingForm user={user} />;
    }

    return <PageHeader title="Accès non autorisé" description="Cette page est réservée aux partenaires établissements et aux créateurs." />;
}
