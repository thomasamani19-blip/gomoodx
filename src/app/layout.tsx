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
                <AuraCanvas />
                <div className="relative z-10">
                  {children}
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
