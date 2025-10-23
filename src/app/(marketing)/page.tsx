'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import AgeGate from '@/components/features/auth/age-gate';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AgeGate />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-background-dark transition-colors duration-700 p-4">

        <div className="halo mb-6">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">
            GoMoodX
          </h1>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-gold text-black dark:text-white shadow-glow max-w-md text-center backdrop-blur-md">
          <p className="opacity-90 mb-5 text-lg">
            Découvrez votre humeur à travers la lumière et la vibration dorée ✨
          </p>

          <Button asChild className="bg-gradient-neon text-white px-6 py-3 rounded-2xl font-semibold shadow-neon hover:scale-105 transition-all duration-300 h-auto text-base">
            <Link href="/inscription">
                Commencer l’expérience 🌟
            </Link>
          </Button>
        </div>

        <div className='absolute top-4 right-4'>
            <ThemeSwitcher />
        </div>
      </div>

       <style jsx global>{`
        .halo {
          position: relative;
          display: inline-block;
        }

        .halo::before {
          content: "";
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle, hsl(var(--primary) / 0.4), transparent);
          filter: blur(50px);
          opacity: 0.7;
          border-radius: 50%;
          animation: haloPulse 4s ease-in-out infinite;
        }

        @keyframes haloPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
