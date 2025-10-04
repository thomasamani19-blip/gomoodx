import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold font-headline", className)}>
      <HeartPulse className="h-6 w-6 text-primary" />
      <span>Élixir Sensuel</span>
    </Link>
  );
}
