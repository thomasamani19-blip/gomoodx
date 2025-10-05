import { LogoGoMoodX } from '@/components/ui/LogoGoMoodX';
import { Github, Twitter, Instagram } from 'lucide-react';
import Link from 'next/link';

export function Footer({ dict }: { dict: any }) {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <LogoGoMoodX />
            <p className="mt-4 text-center md:text-left text-sm text-muted-foreground max-w-xs">
              La destination exclusive pour des expériences sensuelles et des contenus uniques.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-headline text-lg font-semibold">Liens</h3>
            <ul className="mt-4 space-y-2">
                <li><Link href="/cgu" className="text-sm text-muted-foreground hover:text-primary">{dict.links.cgu}</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">{dict.links.privacy}</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">{dict.links.contact}</Link></li>
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-headline text-lg font-semibold">Suivez-nous</h3>
            <div className="flex mt-4 space-x-4">
                <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter className="h-6 w-6" /></a>
                <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></a>
                <a href="#" aria-label="Github" className="text-muted-foreground hover:text-primary"><Github className="h-6 w-6" /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} GoMoodX. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
