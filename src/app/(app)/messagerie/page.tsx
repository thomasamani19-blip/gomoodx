
'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search, Send, Video, Phone, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, User, Call, CallType, Reservation } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where, orderBy, or, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function MessagerieContent() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const messageEndRef = useRef<HTMLDivElement>(null);

    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [recentContacts, setRecentContacts] = useState<{ contact: User; lastMessage: Message }[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [callConfirmation, setCallConfirmation] = useState<{ show: boolean; type: CallType | null }>({ show: false, type: null });
    const [unlockedContacts, setUnlockedContacts] = useState<string[]>([]);
    const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);

    const contactIdFromUrl = searchParams.get('contact');
    
    // Fetch user for contact from URL
    const contactRef = useMemo(() => {
        if (!firestore || !contactIdFromUrl) return null;
        return doc(firestore, 'users', contactIdFromUrl);
    }, [firestore, contactIdFromUrl]);

    const { data: contactFromUrl, loading: contactLoading } = useDoc<User>(contactRef);
    
    useEffect(() => {
        if (contactFromUrl && !contactsLoading) {
            setSelectedContact(contactFromUrl);
        }
    }, [contactFromUrl, contactsLoading]);


    // 1. Fetch messages for the current user and derive contacts
    useEffect(() => {
        if (!user || !firestore) {
            setContactsLoading(false);
            return;
        }

        const fetchContacts = async () => {
            setContactsLoading(true);
            try {
                // Fetch all messages involving the current user
                const messagesQuery = query(
                    collection(firestore, 'messages'),
                    or(where('senderId', '==', user.id), where('receiverId', '==', user.id)),
                    orderBy('createdAt', 'desc')
                );

                const messagesSnapshot = await getDocs(messagesQuery);
                const allUserMessages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));

                // Get unique contact IDs
                const contactIds = new Set<string>();
                allUserMessages.forEach(msg => {
                    const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
                    if (otherUserId) {
                        contactIds.add(otherUserId);
                    }
                });
                
                if (contactIdFromUrl) {
                    contactIds.add(contactIdFromUrl);
                }
                
                if (contactIds.size === 0) {
                    setRecentContacts([]);
                    setContactsLoading(false);
                    return;
                }
                
                // Fetch user details for these contacts
                const usersQuery = query(collection(firestore, 'users'), where('__name__', 'in', Array.from(contactIds)));
                const usersSnapshot = await getDocs(usersQuery);
                const userMap = new Map(usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as User]));

                // Create the recent contacts list
                const conversations = new Map<string, { contact: User; lastMessage?: Message }>();

                // Add contacts from messages
                allUserMessages.forEach(msg => {
                    const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
                    if (!conversations.has(otherUserId)) {
                        const contactUser = userMap.get(otherUserId);
                        if (contactUser) {
                            conversations.set(otherUserId, {
                                contact: contactUser,
                                lastMessage: msg,
                            });
                        }
                    }
                });
                
                // Ensure contact from URL is in the list
                if (contactIdFromUrl) {
                    const contactUser = userMap.get(contactIdFromUrl);
                    if (contactUser && !conversations.has(contactIdFromUrl)) {
                         conversations.set(contactIdFromUrl, {
                            contact: contactUser,
                            lastMessage: { message: "Nouvelle conversation", createdAt: serverTimestamp()} as unknown as Message
                         });
                    }
                }
                
                const sortedContacts = Array.from(conversations.values()).sort((a,b) => {
                    const timeA = a.lastMessage?.createdAt?.toDate()?.getTime() || 0;
                    const timeB = b.lastMessage?.createdAt?.toDate()?.getTime() || 0;
                    return timeB - timeA;
                });

                setRecentContacts(sortedContacts);
            } catch (error) {
                console.error("Error fetching contacts:", error);
            } finally {
                setContactsLoading(false);
            }
        };

        fetchContacts();
    }, [user, firestore, contactIdFromUrl]);

    // Check if contact is unlocked via Pass or active reservation
    useEffect(() => {
        if (!user || !selectedContact || !firestore) {
            setUnlockedContacts([]);
            return;
        };

        setIsCheckingUnlock(true);
        const checkAccess = async () => {
            let unlocked = new Set<string>(user.unlockedContacts || []);

            // Check for active reservations
            const reservationsQuery = query(
                collection(firestore, 'reservations'),
                where('status', '==', 'confirmed'),
                or(
                    // User is the member and contact is an involved escort
                    and(
                        where('memberId', '==', user.id),
                        where('escorts', 'array-contains', { id: selectedContact.id, name: selectedContact.displayName, profileImage: selectedContact.profileImage, rate: selectedContact.rates?.escortPerHour || 0 })
                    ),
                    // User is an escort and contact is the member
                    and(
                        where('memberId', '==', selectedContact.id),
                        where('escorts', 'array-contains', { id: user.id, name: user.displayName, profileImage: user.profileImage, rate: user.rates?.escortPerHour || 0 })
                    )
                )
            );
            const reservationsSnapshot = await getDocs(reservationsQuery);
            if (!reservationsSnapshot.empty) {
                unlocked.add(selectedContact.id);
            }
            setUnlockedContacts(Array.from(unlocked));
            setIsCheckingUnlock(false);
        };

        checkAccess();

    }, [user, selectedContact, firestore]);

    // 2. Listen to messages for the selected contact in real-time
    const activeMessagesQuery = useMemo(() => {
        if (!user || !selectedContact || !firestore) return null;
        
        return query(
            collection(firestore, "messages"),
            where('senderId', 'in', [user.id, selectedContact.id]),
            where('receiverId', 'in', [user.id, selectedContact.id]),
            orderBy("createdAt", "asc")
        );

    }, [user, selectedContact, firestore]);
    
    const { data: allMessages, loading: messagesLoading } = useCollection<Message>(
        activeMessagesQuery
    );

    const activeMessages = useMemo(() => {
        if (!allMessages || !user || !selectedContact) return [];
        return allMessages.filter(msg => 
            (msg.senderId === user.id && msg.receiverId === selectedContact.id) ||
            (msg.senderId === selectedContact.id && msg.receiverId === user.id)
        );
    }, [allMessages, user, selectedContact]);


    // Scroll to the bottom of the messages when a new message is added and mark as read
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (firestore && user && activeMessages && activeMessages.length > 0) {
            const unreadMessages = activeMessages.filter(
                (msg) => msg.receiverId === user.id && !msg.isRead
            );
            if (unreadMessages.length > 0) {
                unreadMessages.forEach(async (msg) => {
                    const msgRef = doc(firestore, 'messages', msg.id);
                    await updateDoc(msgRef, { isRead: true });
                });
            }
        }
    }, [activeMessages, firestore, user]);


    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedContact || !firestore) return;
        
        if (!isCheckingUnlock && !unlockedContacts.includes(selectedContact.id)) {
            toast({
                title: "Accès non autorisé",
                description: "Vous devez débloquer ce contact pour envoyer un message.",
                variant: "destructive"
            });
            return;
        }

        const messageData: Omit<Message, 'id'> = {
            message: newMessage,
            senderId: user.id,
            receiverId: selectedContact.id,
            createdAt: serverTimestamp() as any,
            isRead: false,
            type: 'text',
        };

        try {
            await addDoc(collection(firestore, 'messages'), messageData);
            setNewMessage('');
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
        }
    };
    
    const handleInitiateCall = async () => {
        if (!user || !selectedContact || !firestore || !callConfirmation.type) return;

        const callType = callConfirmation.type;
        setCallConfirmation({ show: false, type: null });

        toast({ title: "Initiation de l'appel...", description: `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} avec ${selectedContact.displayName} en cours de préparation.` });
        
        const pricePerMinute = callType === 'video' ? selectedContact.rates?.videoCallPerMinute : undefined;

        const callData: Omit<Call, 'id'> = {
            callerId: user.id,
            receiverId: selectedContact.id,
            callerName: user.displayName || 'Utilisateur',
            status: 'pending',
            type: callType,
            createdAt: serverTimestamp() as any,
            ...(pricePerMinute && { pricePerMinute }),
        };

        try {
            const callDocRef = await addDoc(collection(firestore, 'calls'), callData);
            router.push(`/appels/${callDocRef.id}`);
        } catch (error) {
            console.error(`Erreur lors de l'initiation de l'appel ${callType}:`, error);
            toast({
                title: "Erreur d'appel",
                description: "Impossible de démarrer l'appel. Veuillez réessayer.",
                variant: 'destructive'
            });
        }
    };

    const loading = authLoading || contactsLoading;
    const videoCallRate = selectedContact?.rates?.videoCallPerMinute;
    const isContactUnlocked = selectedContact && unlockedContacts.includes(selectedContact.id);


    return (
    <div className="h-[calc(100vh_-_10rem)] flex flex-col">
      <PageHeader
        title="Messagerie Privée"
        description="Échangez avec les autres membres en toute discrétion."
      />
      <Card className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full overflow-hidden">
        <div className="col-span-1 border-r flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="relative">
                    <Input placeholder="Rechercher un contact..." className="pl-10" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {loading && Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
                {!loading && recentContacts?.map(({contact, lastMessage}) => (
                    <button 
                        key={contact.id} 
                        className={cn(
                            "flex items-center gap-4 p-4 w-full text-left hover:bg-accent/50",
                            selectedContact?.id === contact.id && "bg-accent"
                        )}
                        onClick={() => setSelectedContact(contact)}
                    >
                        <Avatar>
                            <AvatarImage src={contact.profileImage} alt={contact.displayName} />
                            <AvatarFallback>{contact.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{contact.displayName}</p>
                            <p className="text-sm text-muted-foreground truncate">{lastMessage.message}</p>
                        </div>
                         {lastMessage?.createdAt && (
                           <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                            {lastMessage.createdAt.toDate ? formatDistanceToNow(lastMessage.createdAt.toDate(), { addSuffix: true, locale: fr }) : ''}
                           </span>
                        )}
                    </button>
                ))}
                 {!loading && recentContacts.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Aucune conversation récente.</div>
                )}
            </ScrollArea>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
            {selectedContact ? (
                <>
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <Link href={`/profil/${selectedContact.id}`} className="flex items-center gap-4 group">
                            <Avatar>
                                <AvatarImage src={selectedContact.profileImage} alt={selectedContact.displayName} />
                                <AvatarFallback>{selectedContact.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                            <h2 className="font-semibold text-lg group-hover:underline">{selectedContact.displayName}</h2>
                        </Link>
                        {selectedContact.role === 'escorte' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <ChevronDown className="h-4 w-4 text-primary/70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setCallConfirmation({ show: true, type: 'video' })}>
                                        <Video className="mr-2 h-4 w-4" />
                                        Appel Vidéo {videoCallRate && `(${videoCallRate}€/min)`}
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => setCallConfirmation({ show: true, type: 'voice' })}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Appel Vocal
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <ScrollArea className="flex-1 p-6 bg-muted/20">
                        <div className="space-y-6">
                            {messagesLoading && <div className="text-center text-muted-foreground">Chargement des messages...</div>}
                            {!messagesLoading && activeMessages?.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.id ? 'justify-end' : '')}>
                                    {msg.senderId !== user?.id && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedContact.profileImage} />
                                            <AvatarFallback>{selectedContact.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 max-w-sm break-words",
                                        msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-card border'
                                    )}>
                                        <p>{msg.message}</p>
                                    </div>
                                     {msg.senderId === user?.id && user?.profileImage && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profileImage} />
                                            <AvatarFallback>{user.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            <div ref={messageEndRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t mt-auto bg-card">
                        <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                            <Input placeholder="Écrivez votre message..." autoComplete="off" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={!isContactUnlocked || isCheckingUnlock} />
                            <Button type="submit" size="icon" variant="ghost" disabled={!newMessage.trim() || !isContactUnlocked || isCheckingUnlock}>
                                <Send className="h-5 w-5 text-primary" />
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full bg-muted/20">
                    <div className="text-center">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Sélectionnez une conversation</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Choisissez une conversation dans la liste pour commencer à discuter.</p>
                    </div>
                </div>
            )}
        </div>
      </Card>
      <AlertDialog open={callConfirmation.show} onOpenChange={(open) => setCallConfirmation({show: open, type: null})}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmer l'appel</AlertDialogTitle>
                <AlertDialogDescription>
                    {callConfirmation.type === 'video' && videoCallRate ? 
                    `Lancer un appel vidéo avec ${selectedContact?.displayName} ? Cet appel sera facturé ${videoCallRate}€ par minute.` :
                    `Lancer un appel vocal gratuit avec ${selectedContact?.displayName} ?`}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleInitiateCall}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    );
}

export default function MessageriePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <MessagerieContent />
        </Suspense>
    )
}

    
