'use client';

import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate sending a message
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Message envoyé !",
                description: "Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.",
            });
            (e.target as HTMLFormElement).reset();
        }, 1500);
    }

    return (
        <div className="space-y-16">
            <PageHeader
                title="Nous Contacter"
                description="Une question, une suggestion ? N'hésitez pas à nous écrire."
            />
            <div className="max-w-2xl mx-auto">
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Formulaire de Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Votre nom</Label>
                                    <Input id="name" name="name" required placeholder="Jean Dupont" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Votre email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="nom@exemple.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Sujet</Label>
                                <Input id="subject" name="subject" required placeholder="Sujet de votre message" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" name="message" required placeholder="Écrivez votre message ici..." rows={6} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4"/>}
                                {isLoading ? 'Envoi en cours...' : 'Envoyer le Message'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
