import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import { Github, Twitter, Instagram } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { label: 'À propos', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Conditions d\'utilisation', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Github, href: '#', label: 'Github' },
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <GoMoodXLogo />
            <p className="mt-4 text-center md:text-left text-sm text-muted-foreground max-w-xs">
              La destination exclusive pour des expériences sensuelles et des contenus uniques.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-headline text-lg font-semibold">Liens rapides</h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-headline text-lg font-semibold">Suivez-nous</h3>
            <div className="flex mt-4 space-x-4">
              {socialLinks.map(social => (
                <a key={social.label} href={social.href} aria-label={social.label} className="text-muted-foreground hover:text-primary">
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
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
