
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
    const [role, setRole] = useState<UserRole>('client');
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

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
            <CardTitle className="font-headline text-2xl">Créer un compte</CardTitle>
            <CardDescription>Rejoignez la communauté GoMoodX</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label>Je suis un(e)...</Label>
                <RadioGroup 
                    name="role" 
                    defaultValue="client" 
                    className="grid grid-cols-3 gap-4"
                    onValueChange={(value) => setRole(value as UserRole)}
                >
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
                     <div>
                        <RadioGroupItem value="partenaire" id="partenaire" className="peer sr-only" />
                        <Label
                        htmlFor="partenaire"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Partenaire
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {role === 'partenaire' && (
                 <div className="grid gap-2">
                    <Label>Type de partenaire</Label>
                    <RadioGroup name="partnerType" defaultValue="establishment" className="grid grid-cols-2 gap-4">
                         <div>
                            <RadioGroupItem value="establishment" id="establishment" className="peer sr-only" />
                            <Label htmlFor="establishment" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Établissement
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="producer" id="producer" className="peer sr-only" />
                            <Label htmlFor="producer" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Producteur
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            )}

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
