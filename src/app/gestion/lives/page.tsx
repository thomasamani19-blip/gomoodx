

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { LiveSession } from '@/lib/types';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Loader2, Video, Ticket, Bot, Play } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function GestionLivesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<LiveSession | null>(null);

  const livesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'lives'),
      where('hostId', '==', user.id),
      orderBy('startTime', 'desc')
    );
  }, [user, firestore]);

  const { data: lives, loading: livesLoading, setData: setLives } = useCollection<LiveSession>(livesQuery);

  const loading = authLoading || livesLoading;

  const handleDelete = async () => {
    if (!sessionToDelete || !firestore) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'lives', sessionToDelete.id));
      setLives(prev => prev?.filter(l => l.id !== sessionToDelete.id) || null);
      toast({ title: "Session Live supprimée" });
    } catch (error) {
      console.error("Error deleting live session:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer la session.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader title="Gérer mes Lives" description="Planifiez et gérez vos sessions de live streaming." />
        <Button asChild>
          <Link href="/gestion/lives/creer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Planifier un Live
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes Sessions Live</CardTitle>
          <CardDescription>{loading ? 'Chargement...' : `Vous avez ${lives?.length || 0} session(s) live.`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lives && lives.map(live => (
                  <TableRow key={live.id}>
                    <TableCell className="font-medium">{live.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {live.liveType === 'ai' && <Bot className="h-3 w-3" />}
                        {live.liveType === 'creator' && (!live.ticketPrice || live.ticketPrice <= 0) && <Video className="h-3 w-3" />}
                        {live.liveType === 'creator' && live.ticketPrice && live.ticketPrice > 0 && <Ticket className="h-3 w-3" />}
                        {live.liveType === 'ai' ? 'Live IA' : (live.ticketPrice && live.ticketPrice > 0 ? 'Payant' : 'Gratuit')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(live.startTime.toDate(), "d MMM yyyy 'à' HH:mm", { locale: fr })}</TableCell>
                    <TableCell><Badge variant={live.status === 'live' ? 'destructive' : 'secondary'}>{live.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Button asChild>
                         <Link href={`/gestion/lives/studio/${live.id}`}>
                           <Play className="mr-2 h-4 w-4" /> Lancer le studio
                         </Link>
                       </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild><Link href={`/live/${live.id}`}><Video className="mr-2 h-4 w-4" />Voir le live</Link></DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setSessionToDelete(live)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && (!lives || lives.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vous n'avez planifié aucune session live.</p>
              <Button asChild className="mt-4"><Link href="/gestion/lives/creer"><PlusCircle className="mr-2 h-4 w-4" />Planifier un Live</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!sessionToDelete} onOpenChange={open => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera la session live "{sessionToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
