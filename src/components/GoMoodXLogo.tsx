import Link from 'next/link';
import { cn } from '@/lib/utils';

export function GoMoodXLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-2xl font-bold font-headline',
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(236, 72, 153)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(139, 92, 246)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path
          d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
        />
        <path
          d="M17 8.5L7 15.5M7 8.5L17 15.5"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">GoMoodX</span>
    </Link>
  );
}
