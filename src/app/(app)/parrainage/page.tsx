
'use client';

import PageHeader from "@/components/shared/page-header";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Share2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Settings } from "@/lib/types";
import { useMemo } from "react";
import {
  EmailShareButton,
  FacebookShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailIcon,
  FacebookIcon,
  TelegramIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';

export default function ParrainagePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);
    
    const loading = authLoading || settingsLoading;

    if (loading) {
        return (
            <div>
                <PageHeader title="Programme de Parrainage" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        )
    }
    
    if (!user) {
        return <p>Veuillez vous connecter pour voir votre programme de parrainage.</p>
    }

    const referralCode = user.referralCode || 'INCONNU';
    const shareUrl = `${window.location.origin}/inscription?ref=${referralCode}`;
    const shareTitle = `Rejoignez-moi sur GoMoodX !`;
    const shareMessage = `Utilisez mon code de parrainage pour vous inscrire sur GoMoodX, la plateforme exclusive pour les créateurs et leurs fans. Code : ${referralCode}`;
    const referralBonus = settings?.rewards?.referralBonus || 0;
    const welcomeBonus = settings?.welcomeBonusAmount || 0;


    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        toast({ title: "Code copié !", description: "Votre code de parrainage a été copié dans le presse-papiers."});
    };

    return (
        <div>
            <PageHeader
                title="Programme de Parrainage"
                description="Invitez vos amis et gagnez des récompenses !"
            />
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-2xl">Votre code de parrainage</CardTitle>
                        <CardDescription>Partagez ce code unique avec vos amis. Lorsqu'ils s'inscrivent et effectuent leur premier achat, vous recevez tous les deux une récompense !</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Input value={referralCode} readOnly className="text-2xl font-mono tracking-widest h-12" />
                            <Button size="icon" onClick={handleCopy}><Copy className="h-5 w-5" /></Button>
                        </div>
                        <div className="flex items-center gap-2">
                             <p className="text-sm font-medium">Partager sur :</p>
                             <div className="flex gap-2">
                                <WhatsappShareButton url={shareUrl} title={shareMessage}><WhatsappIcon size={32} round /></WhatsappShareButton>
                                <TelegramShareButton url={shareUrl} title={shareMessage}><TelegramIcon size={32} round /></TelegramShareButton>
                                <TwitterShareButton url={shareUrl} title={shareMessage}><TwitterIcon size={32} round /></TwitterShareButton>
                                <FacebookShareButton url={shareUrl} quote={shareMessage}><FacebookIcon size={32} round /></FacebookShareButton>
                                <EmailShareButton url={shareUrl} subject={shareTitle} body={shareMessage}><EmailIcon size={32} round /></EmailShareButton>
                                <Button variant="outline" size="icon" onClick={() => navigator.share({ title: shareTitle, text: shareMessage, url: shareUrl })}><Share2 className="h-5 w-5" /></Button>
                             </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                     <Card className="bg-primary/10 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary"/> Vos Avantages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{referralBonus} points</p>
                            <p className="text-sm text-muted-foreground">pour chaque ami qui s'inscrit et fait un premier dépôt.</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-secondary/10 border-secondary/20">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-secondary-foreground"/> Avantages pour vos Amis</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold">{welcomeBonus}€ offerts</p>
                            <p className="text-sm text-muted-foreground">sur leur premier rechargement de portefeuille.</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Vos Filleuls</CardTitle>
                    </CardHeader>
                     <CardContent className="flex items-center justify-around text-center">
                        <div>
                             <p className="text-4xl font-bold">{user.referralsCount || 0}</p>
                             <p className="text-muted-foreground">Personnes parrainées</p>
                        </div>
                        <div>
                             <p className="text-4xl font-bold">{user.rewardPoints || 0}</p>
                             <p className="text-muted-foreground">Points de récompense gagnés</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
