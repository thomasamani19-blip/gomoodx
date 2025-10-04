import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { Playfair_Display, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

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
  title: 'GoMoodX',
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
        <FirebaseClientProvider>
            <AuthProvider>
                {children}
                <Toaster />
            </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
