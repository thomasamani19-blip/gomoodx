'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GoMoodXLogo } from "@/components/GoMoodXLogo"
import Link from "next/link"
import { ArrowRight, User, Star } from "lucide-react";

export default function InscriptionHubPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
        <GoMoodXLogo className="justify-center mb-2"/>
        <CardTitle className="font-headline text-2xl">Rejoindre GoMoodX</CardTitle>
        <CardDescription>Choisissez votre type de compte pour commencer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Link href="/inscription/client">
                <Card className="p-6 hover:bg-accent/50 hover:border-primary transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <User className="h-8 w-8 text-primary"/>
                            <div>
                                <h3 className="font-semibold text-lg">Je suis un Client</h3>
                                <p className="text-sm text-muted-foreground">Accéder à des contenus exclusifs.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                    </div>
                </Card>
            </Link>
             <Link href="/inscription/escorte">
                <Card className="p-6 hover:bg-accent/50 hover:border-primary transition-all">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Star className="h-8 w-8 text-primary"/>
                            <div>
                                <h3 className="font-semibold text-lg">Je suis un Créateur</h3>
                                <p className="text-sm text-muted-foreground">Monétiser mon contenu et mes services.</p>
                            </div>
                        </div>
                         <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                    </div>
                </Card>
            </Link>
        </CardContent>
        <CardContent className="text-center">
            <p className="text-xs text-center text-muted-foreground">
                Déjà membre ?{" "}
                <Link href="/connexion" className="underline hover:text-primary">
                Connectez-vous
                </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  )
}
