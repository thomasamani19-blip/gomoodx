'use client'

import { usePathname } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  if (!pathname.startsWith('/connexion') && !pathname.startsWith('/inscription')) {
    return null
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        {children}
    </div>
  );
}
