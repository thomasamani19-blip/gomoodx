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
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function InscriptionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-2"/>
          <CardTitle className="font-headline text-2xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez la communauté Élixir Sensuel</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" placeholder="Votre nom" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nom@exemple.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">S'inscrire</Button>
           <p className="text-xs text-center text-muted-foreground">
              Déjà membre ?{" "}
              <Link href="/connexion" className="underline hover:text-primary">
                Connectez-vous
              </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
