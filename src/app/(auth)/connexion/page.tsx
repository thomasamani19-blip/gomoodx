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
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd verify credentials. Here we just log in as 'escorte'.
    login('escorte');
    router.push('/dashboard');
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <GoMoodXLogo className="justify-center mb-2"/>
          <CardTitle className="font-headline text-2xl">Connexion</CardTitle>
          <CardDescription>Accédez à votre espace GoMoodX</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
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
            <Button className="w-full" type="submit">Se connecter</Button>
            <p className="text-xs text-center text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="underline hover:text-primary">
                Inscrivez-vous
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
