import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import { Github, Twitter, Instagram } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Comment ça marche ?', href: '/a-propos' },
  { label: 'Contact', href: '/a-propos' },
  { label: "Conditions d'utilisation", href: '/a-propos' },
  { label: 'Politique de confidentialité', href: '/a-propos' },
];

const forPartners = [
    { label: 'Devenir Partenaire', href: '/inscription/partenaire' },
    { label: 'Portail Partenaire', href: '/connexion' },
]

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Github, href: '#', label: 'Github' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center md:items-start col-span-1 md:col-span-2">
            <GoMoodXLogo />
            <p className="mt-4 text-center md:text-left text-sm text-muted-foreground max-w-xs">
              La destination exclusive pour des expériences sensuelles et des contenus uniques.
            </p>
             <div className="flex mt-6 space-x-4">
              {socialLinks.map(social => (
                <a key={social.label} href={social.href} aria-label={social.label} className="text-muted-foreground hover:text-primary">
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-headline text-lg font-semibold text-primary">Liens rapides</h3>
            <ul className="mt-4 space-y-2 text-center md:text-left">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-headline text-lg font-semibold text-primary">Pour les Partenaires</h3>
            <ul className="mt-4 space-y-2 text-center md:text-left">
              {forPartners.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} GoMoodX. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
