'use client';

import { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Settings {
    enableRingtone: boolean;
}

export default function ParametresPage() {
    const [settings, setSettings] = useState<Settings>({
        enableRingtone: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Load settings from localStorage on component mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('gomoodx_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({
                    enableRingtone: parsedSettings.enableRingtone !== false, // Default to true
                });
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save settings to localStorage whenever they change
    const handleSettingsChange = (key: keyof Settings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            localStorage.setItem('gomoodx_settings', JSON.stringify(newSettings));
            toast({
                title: "Paramètres enregistrés",
                description: "Vos préférences ont été mises à jour.",
            });
        } catch (error) {
            console.error("Failed to save settings to localStorage:", error);
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer vos paramètres.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div>
                <PageHeader title="Paramètres" description="Gérez les préférences de votre compte et de l'application." />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Paramètres"
                description="Gérez les préférences de votre compte et de l'application."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Personnalisez la manière dont vous recevez les notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="ringtone-switch" className="text-base">
                                Activer la sonnerie pour les appels
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Joue un son lorsque vous recevez un appel entrant.
                            </p>
                        </div>
                        <Switch
                            id="ringtone-switch"
                            checked={settings.enableRingtone}
                            onCheckedChange={(checked) => handleSettingsChange('enableRingtone', checked)}
                            aria-label="Activer la sonnerie"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
