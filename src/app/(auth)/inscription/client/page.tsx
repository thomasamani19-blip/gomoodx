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

export default function InscriptionClientPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.role = 'client'; // Set role explicitly

        try {
            await signup(data);
            toast({
                title: "Inscription réussie !",
                description: "Bienvenue sur GoMoodX ! Vous allez être redirigé vers votre tableau de bord.",
            });
            router.push('/dashboard');
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
            <CardTitle className="font-headline text-2xl">Créer un Compte Client</CardTitle>
            <CardDescription>Accédez à un monde de contenus exclusifs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="displayName">Nom d'affichage</Label>
                    <Input id="displayName" name="displayName" placeholder="Votre nom ou pseudo" required />
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer mon compte
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
