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
import type { PartnerType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function InscriptionPartenairePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.role = 'partenaire';

        try {
            await signup(data);
            toast({
                title: "Demande de partenariat envoyée !",
                description: "Votre demande a bien été enregistrée et sera examinée par notre équipe.",
            });
            router.push('/'); // Redirect to homepage
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Une erreur est survenue lors de l'envoi de votre demande.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
            <GoMoodXLogo className="justify-center mb-2"/>
            <CardTitle className="font-headline text-2xl">Devenir Partenaire</CardTitle>
            <CardDescription>Rejoignez le réseau de partenaires GoMoodX et développez votre activité.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <Label>Vous êtes un...</Label>
                    <RadioGroup name="partnerType" defaultValue="establishment" className="grid grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="establishment" id="establishment" className="peer sr-only" />
                            <Label htmlFor="establishment" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Établissement
                            <span className="font-normal text-xs text-muted-foreground">(Hôtel, Club, ...)</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="producer" id="producer" className="peer sr-only" />
                            <Label htmlFor="producer" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Producteur
                             <span className="font-normal text-xs text-muted-foreground">(Photographe, ...)</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyName">Nom de l'entreprise</Label>
                        <Input id="companyName" name="companyName" placeholder="Le nom de votre société" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="registerNumber">Numéro de registre (Optionnel)</Label>
                        <Input id="registerNumber" name="registerNumber" placeholder="Ex: SIRET" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" name="address" placeholder="123 Rue de la République" />
                </div>

                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input id="city" name="city" placeholder="Paris" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input id="country" name="country" placeholder="France" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyEmail">Email de l'entreprise</Label>
                        <Input id="companyEmail" name="companyEmail" type="email" placeholder="contact@exemple.com" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+33 6 12 34 56 78" required/>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="website">Site Web (Optionnel)</Label>
                    <Input id="website" name="website" placeholder="https://mon-site.com" />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="description">Décrivez votre activité</Label>
                    <Textarea id="description" name="description" placeholder="Présentez votre entreprise et ce que vous proposez en quelques mots..." />
                </div>

                 <div>
                    <h3 className="text-base font-medium mb-4 mt-2">Personne de contact</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="managerName">Nom du contact</Label>
                            <Input id="managerName" name="managerName" placeholder="Jean Dupont" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="managerEmail">Email du contact</Label>
                            <Input id="managerEmail" name="managerEmail" type="email" placeholder="jean@exemple.com" />
                        </div>
                    </div>
                 </div>


            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer la demande
                </Button>
                 <p className="text-xs text-center text-muted-foreground">
                    En soumettant, vous acceptez nos{" "}
                    <Link href="/cgu" className="underline hover:text-primary">
                    conditions de partenariat
                    </Link>.
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
