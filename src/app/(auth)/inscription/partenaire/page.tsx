
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// This page is disabled in dev mode and redirects to the dashboard.
export default function InscriptionPartenairePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-[600px] w-[650px]" />
    </div>
  );
}
