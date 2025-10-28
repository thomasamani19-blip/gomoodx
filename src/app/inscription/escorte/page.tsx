'use client';

import { PT_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import CallListener from '@/components/layout/call-listener';
import { AuraCanvas } from '@/components/layout/aura-canvas';
import AgeGate from '@/components/features/auth/age-gate';
import { useAuth } from '@/hooks/use-auth';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <>
      <AuraCanvas />
      <AgeGate />
      <div className="relative z-10">
        {children}
      </div>
      <Toaster />
      {user && <CallListener />}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${playfair.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <AuthProvider>
              <RootLayoutContent>
                {children}
              </RootLayoutContent>
            </AuthProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}