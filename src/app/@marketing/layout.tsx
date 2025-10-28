'use client'

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { usePathname } from 'next/navigation';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const marketingPages = ['/a-propos', '/contact', '/cgu', '/politique-de-confidentialite'];

  if (!marketingPages.includes(pathname)) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
