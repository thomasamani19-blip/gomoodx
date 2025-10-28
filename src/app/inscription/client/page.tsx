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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function InscriptionClientPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
      <Card className="w-full max-w-md">
        <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
            <GoMoodXLogo className="justify-center mb-2"/>
            <CardTitle className="font-headline text-2xl">Créer un Compte Client</CardTitle>
            <CardDescription>Accédez à un monde de contenus exclusifs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="displayName">Nom d'affichage</Label>
                        <Input id="displayName" name="displayName" placeholder="Votre nom ou pseudo" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dateOfBirth">Date de naissance</Label>
                        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input id="country" name="country" placeholder="Ex: France" required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" name="phone" placeholder="+33 6..." required />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Genre</Label>
                    <RadioGroup name="gender" defaultValue="male" className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Homme</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Femme</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">Autre</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required />
                         <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="referredBy">Code de parrainage (Optionnel)</Label>
                    <Input id="referredBy" name="referredBy" placeholder="Code d'un ami" />
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
  )
}
