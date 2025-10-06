'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoMoodXLogo } from "@/components/GoMoodXLogo"
import Link from "next/link"
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function InscriptionEscortePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.role = 'escorte'; // Set role explicitly

        try {
            await signup(data);
            toast({
                title: "Demande d'inscription envoyée !",
                description: "Votre compte est en cours de vérification. Vous serez notifié(e) par e-mail.",
            });
            router.push('/connexion');
        } catch (error: any) {
            toast({
                title: "Erreur d'inscription",
                description: error.message || "Une erreur est survenue.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
            <GoMoodXLogo className="justify-center mb-2"/>
            <CardTitle className="font-headline text-2xl">Devenir Créateur/Créatrice</CardTitle>
            <CardDescription>Rejoignez-nous et commencez à monétiser votre contenu.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="displayName">Nom de scène</Label>
                        <Input id="displayName" name="displayName" placeholder="Ex: Eva Sensuelle" required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="fullName">Nom complet</Label>
                        <Input id="fullName" name="fullName" placeholder="Votre nom légal" required />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date de naissance</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
                <CardDescription className="text-xs">
                    Votre nom complet n'est utilisé que pour la vérification et ne sera jamais public. Une vérification d'identité sera requise.
                </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer ma demande
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    Déjà membre ?{" "}
                    <Link href="/connexion" className="underline hover:text-primary">
                    Connectez-vous
                    </Link>
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
