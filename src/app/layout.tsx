import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { Playfair_Display, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontPlayfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700'],
});

const fontPtSans = PT_Sans({
  subsets: ['latin'],
  variable: '--font-pt-sans',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Élixir Sensuel',
  description: 'La plateforme exclusive pour créateurs et membres.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={cn(
          "min-h-screen bg-background font-body antialiased",
          fontPlayfair.variable,
          fontPtSans.variable
      )}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
