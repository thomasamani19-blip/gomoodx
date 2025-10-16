'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import type { SupportTicket, User } from '@/lib/types';
import { collection, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Check, Mail, MessageSquare, Archive, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const UserCell = ({ userId }: { userId: string }) => {
    const firestore = useFirestore();
    const userRef = useMemo(() => firestore ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: user, loading } = useDoc<User>(userRef);

    if (loading) return <Skeleton className="h-4 w-24" />;
    return <span className="font-medium">{user?.displayName || 'Utilisateur inconnu'}</span>;
};

const TicketTable = ({ tickets, loading, onSelectTicket }: { tickets: SupportTicket[] | null, loading: boolean, onSelectTicket: (ticket: SupportTicket) => void }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!loading && tickets && tickets.length > 0 ? (
                    tickets.map(ticket => (
                        <TableRow key={ticket.id} onClick={() => onSelectTicket(ticket)} className="cursor-pointer">
                            <TableCell className="font-semibold">{ticket.subject}</TableCell>
                            <TableCell><UserCell userId={ticket.userId} /></TableCell>
                            <TableCell>{formatDistanceToNow(ticket.createdAt.toDate(), { locale: fr, addSuffix: true })}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">Voir</Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    !loading && <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun ticket dans cette catégorie.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );
};


export default function AdminSupportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [response, setResponse] = useState('');

    const openTicketsQuery = useMemo(() => firestore ? query(collection(firestore, 'supportTickets'), where('status', '==', 'open'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const closedTicketsQuery = useMemo(() => firestore ? query(collection(firestore, 'supportTickets'), where('status', 'in', ['resolved', 'closed']), orderBy('createdAt', 'desc')) : null, [firestore]);

    const { data: openTickets, loading: openTicketsLoading } = useCollection<SupportTicket>(openTicketsQuery);
    const { data: closedTickets, loading: closedTicketsLoading } = useCollection<SupportTicket>(closedTicketsQuery);

    const handleUpdateStatus = async (status: 'resolved' | 'closed') => {
        if (!selectedTicket || !firestore) return;
        setIsResponding(true);
        try {
            const ticketRef = doc(firestore, 'supportTickets', selectedTicket.id);
            await updateDoc(ticketRef, { 
                status,
                adminResponse: response || 'Ticket résolu sans réponse.',
                resolvedAt: serverTimestamp()
            });
            toast({ title: 'Ticket mis à jour' });
            setSelectedTicket(null);
            setResponse('');
        } catch (error) {
            toast({ title: 'Erreur', variant: 'destructive'});
        } finally {
            setIsResponding(false);
        }
    };
    
    return (
        <div>
            <PageHeader title="Support Technique" description="Gérez les tickets de support ouverts par les utilisateurs." />
            <Card>
                <Tabs defaultValue="open">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="open">Tickets Ouverts <Badge variant="destructive" className="ml-2">{openTickets?.length || 0}</Badge></TabsTrigger>
                        <TabsTrigger value="closed">Tickets Fermés</TabsTrigger>
                    </TabsList>
                    <TabsContent value="open">
                        <TicketTable tickets={openTickets} loading={openTicketsLoading} onSelectTicket={setSelectedTicket} />
                    </TabsContent>
                    <TabsContent value="closed">
                         <TicketTable tickets={closedTickets} loading={closedTicketsLoading} onSelectTicket={setSelectedTicket} />
                    </TabsContent>
                </Tabs>
            </Card>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                        <DialogDescription>
                            Ticket de <UserCell userId={selectedTicket?.userId || ''} /> - {selectedTicket ? formatDistanceToNow(selectedTicket.createdAt.toDate(), { locale: fr, addSuffix: true }) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4">
                        <p className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedTicket?.message}</p>
                        {selectedTicket?.relatedId && (
                             <p className="text-sm text-muted-foreground">ID lié: {selectedTicket.relatedId}</p>
                        )}

                        {selectedTicket?.status !== 'open' && selectedTicket?.adminResponse && (
                            <div>
                                <Label className="font-semibold">Votre réponse</Label>
                                <p className="text-sm bg-primary/10 p-4 rounded-md whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                            </div>
                        )}
                        
                        {selectedTicket?.status === 'open' && (
                             <div className="space-y-2">
                                <Label htmlFor="response">Répondre et résoudre</Label>
                                <Textarea id="response" value={response} onChange={(e) => setResponse(e.target.value)} rows={5} placeholder="Votre réponse à l'utilisateur..." />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                         {selectedTicket?.status === 'open' ? (
                            <>
                                <Button variant="secondary" onClick={() => setSelectedTicket(null)}>Fermer</Button>
                                <Button onClick={() => handleUpdateStatus('resolved')} disabled={isResponding}>
                                    {isResponding && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    <Check className="mr-2 h-4 w-4" /> Marquer comme résolu
                                </Button>
                            </>
                         ) : (
                             <Button onClick={() => setSelectedTicket(null)}>Fermer</Button>
                         )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
