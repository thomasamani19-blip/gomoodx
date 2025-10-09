
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// This page is disabled in dev mode and redirects to the dashboard.
export default function InscriptionClientPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-[500px] w-[450px]" />
    </div>
  );
}
