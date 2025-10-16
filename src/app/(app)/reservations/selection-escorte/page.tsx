'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CheckCircle, Search, UserPlus, Users } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function SelectionEscorteContent() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const reservationUrl = searchParams.get('redirect');
    const initialSelection = searchParams.get('selected')?.split(',').filter(id => id) || [];
    
    const [selectedEscortIds, setSelectedEscortIds] = useState<string[]>(initialSelection);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [ageRange, setAgeRange] = useState([18, 65]);

    const escortsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'escorte'), where('status', '==', 'active'), orderBy('displayName'));
    }, [firestore]);
    const { data: allEscorts, loading: escortsLoading } = useCollection<User>(escortsQuery);
    
    const loading = authLoading || escortsLoading;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/connexion');
        }
    }, [loading, user, router]);

    const filteredEscorts = useMemo(() => {
        if (!allEscorts) return [];
        return allEscorts.filter(escort => {
            const escortAge = calculateAge(escort.dateOfBirth);
            const nameMatch = escort.displayName.toLowerCase().includes(searchTerm.toLowerCase());
            const locationMatch = !locationFilter || (escort.city?.toLowerCase().includes(locationFilter.toLowerCase()) || escort.country?.toLowerCase().includes(locationFilter.toLowerCase()));
            const ageMatch = !escortAge || (escortAge >= ageRange[0] && escortAge <= (ageRange[1] === 65 ? 100 : ageRange[1]));
            return nameMatch && locationMatch && ageMatch;
        });
    }, [allEscorts, searchTerm, locationFilter, ageRange]);

    const handleToggleSelection = (escortId: string) => {
        setSelectedEscortIds(prev => {
            if (prev.includes(escortId)) {
                return prev.filter(id => id !== escortId);
            } else {
                return [...prev, escortId];
            }
        });
    };

    const handleConfirmSelection = () => {
        if (!reservationUrl) return;
        const newUrl = new URL(reservationUrl, window.location.origin);
        if (selectedEscortIds.length > 0) {
            newUrl.searchParams.set('selected', selectedEscortIds.join(','));
        } else {
            newUrl.searchParams.delete('selected');
        }
        router.push(newUrl.toString());
    };
    
    if (loading) {
        return (
            <div>
                <PageHeader title="Sélectionner des Accompagnateurs" description="Chargement..." />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({length: 12}).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="pb-24">
            <PageHeader title="Sélectionner des Accompagnateurs" description="Choisissez une ou plusieurs personnes pour vous accompagner." />

            <Card className="mb-8 p-4 sticky top-16 z-20 bg-background/80 backdrop-blur-sm">
                <div className="grid md:grid-cols-3 gap-4">
                    <Input placeholder="Rechercher par nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Input placeholder="Filtrer par ville ou pays..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
                    <div className="space-y-2">
                        <Label>Tranche d'âge: {ageRange[0]} - {ageRange[1] === 65 ? '65+' : ageRange[1]} ans</Label>
                        <Slider value={ageRange} onValueChange={(v) => setAgeRange(v as [number, number])} min={18} max={65} step={1} />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredEscorts.map(escort => {
                    const isSelected = selectedEscortIds.includes(escort.id);
                    return (
                        <Card key={escort.id} className={cn("overflow-hidden group cursor-pointer transition-all", isSelected && "ring-2 ring-primary")} onClick={() => handleToggleSelection(escort.id)}>
                            <div className="relative aspect-[3/4]">
                                <Image src={escort.profileImage || `https://picsum.photos/seed/${escort.id}/400/600`} alt={escort.displayName} fill className="object-cover" />
                                {isSelected && (
                                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                        <CheckCircle className="h-12 w-12 text-primary-foreground" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="font-bold text-white truncate">{escort.displayName}</p>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t backdrop-blur-sm z-30 flex justify-center">
                <Button size="lg" onClick={handleConfirmSelection} disabled={!reservationUrl}>
                    <Users className="mr-2 h-5 w-5" />
                    Confirmer la sélection ({selectedEscortIds.length})
                </Button>
            </div>
        </div>
    )
}


export default function SelectionEscortePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SelectionEscorteContent />
        </Suspense>
    );
}