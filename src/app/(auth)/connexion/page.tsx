
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
       toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter. Veuillez vérifier vos identifiants.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
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
                Se connecter
            </Button>
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
