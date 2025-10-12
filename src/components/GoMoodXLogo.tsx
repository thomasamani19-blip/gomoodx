
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function GoMoodXLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-2xl font-bold font-headline',
        className
      )}
    >
      <Sparkles className="h-6 w-6 text-primary" />
      <span className="text-foreground">GoMoodX</span>
    </Link>
  );
}
