
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function InscriptionPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as UserRole;

        try {
            await signup(email, password, name, role);
            toast({
                title: "Inscription réussie !",
                description: "Vous allez être redirigé vers votre tableau de bord.",
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
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
            <GoMoodXLogo className="justify-center mb-2"/>
            <CardTitle className="font-headline text-2xl">Créer un compte</CardTitle>
            <CardDescription>Rejoignez la communauté GoMoodX</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label>Je suis un(e)...</Label>
                <RadioGroup name="role" defaultValue="client" className="grid grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="client" id="client" className="peer sr-only" />
                        <Label
                        htmlFor="client"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Client
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="escorte" id="escorte" className="peer sr-only" />
                        <Label
                        htmlFor="escorte"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Escorte
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="name">Nom d'affichage</Label>
                <Input id="name" name="name" placeholder="Votre nom" required />
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
                    S'inscrire
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

    