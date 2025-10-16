
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gold-pulse">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
