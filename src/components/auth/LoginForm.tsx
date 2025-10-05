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
import { LogoGoMoodX } from "@/components/ui/LogoGoMoodX"
import Link from "next/link"
import { useState } from "react";
import { Loader2 } from "lucide-react";
// import { useAuth } from "@/hooks/useAuthRedirect";

export function LoginForm() {
  // const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // await login(email, password);
      // router.push('/account/dashboard');
      console.log('Login attempt with:', email);
    } catch (err: any) {
       setError(err.message || "Failed to login.");
    } finally {
        setIsLoading(false);
    }
  }
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <LogoGoMoodX className="justify-center mb-2"/>
        <CardTitle className="font-headline text-2xl">Connexion</CardTitle>
        <CardDescription>Accédez à votre espace GoMoodX</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="underline hover:text-primary">
              Inscrivez-vous
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
