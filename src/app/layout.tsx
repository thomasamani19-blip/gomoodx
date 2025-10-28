import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import CallListener from '@/components/layout/call-listener';
import { AuraCanvas } from '@/components/layout/aura-canvas';
import AgeGate from '@/components/features/auth/age-gate';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';


const ptSans = PT_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-pt-sans'
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair'
});

export const metadata: Metadata = {
  title: 'GoMoodX',
  description: 'Votre destination pour des contenus et des expériences exclusives.',
};

export default function RootLayout({
  auth,
  app,
  marketing
}: {
  children: React.ReactNode;
  auth: React.ReactNode;
  app: React.ReactNode;
  marketing: React.ReactNode;

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
                <AuraCanvas />
                <AgeGate />
                <div className="relative z-10">
                  {auth}
                  {app}
                  {marketing}
                </div>
                <Toaster />
                <CallListener />
            </AuthProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
