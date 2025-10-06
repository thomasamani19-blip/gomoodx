
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where, orderBy, or, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MessageriePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const messageEndRef = useRef<HTMLDivElement>(null);

    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [recentContacts, setRecentContacts] = useState<{ contact: User; lastMessage: Message }[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);

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
                    contactIds.add(otherUserId);
                });

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
                const conversations = new Map<string, { contact: User; lastMessage: Message }>();
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

                setRecentContacts(Array.from(conversations.values()));
            } catch (error) {
                console.error("Error fetching contacts:", error);
            } finally {
                setContactsLoading(false);
            }
        };

        fetchContacts();
    }, [user, firestore]);

    // 2. Listen to messages for the selected contact in real-time
    const activeMessagesQuery = useMemo(() => {
        if (!user || !selectedContact || !firestore) return null;
        
        const q = query(
            collection(firestore, 'messages'),
            orderBy('createdAt', 'asc')
        );
        return q;

    }, [user, selectedContact, firestore]);
    
    const { data: activeMessages, loading: messagesLoading } = useCollection<Message>(
        activeMessagesQuery
    );

     // 3. Filter messages on the client side
     const filteredActiveMessages = useMemo(() => {
        if (!activeMessages || !user || !selectedContact) return [];
        return activeMessages.filter(msg =>
            (msg.senderId === user.id && msg.receiverId === selectedContact.id) ||
            (msg.senderId === selectedContact.id && msg.receiverId === user.id)
        );
    }, [activeMessages, user, selectedContact]);


    // Scroll to the bottom of the messages when a new message is added
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredActiveMessages]);


    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedContact || !firestore) return;

        const messageData = {
            message: newMessage,
            senderId: user.id,
            receiverId: selectedContact.id,
            createdAt: serverTimestamp(),
            isRead: false,
            type: 'text',
            callType: 'none',
        };

        try {
            await addDoc(collection(firestore, 'messages'), messageData);
            setNewMessage('');
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
        }
    };
    
    const loading = authLoading || contactsLoading;

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
                         {lastMessage.createdAt && (
                           <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                            {formatDistanceToNow(lastMessage.createdAt.toDate(), { addSuffix: true, locale: fr })}
                           </span>
                        )}
                    </button>
                ))}
            </ScrollArea>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
            {selectedContact ? (
                <>
                    <div className="p-4 border-b flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={selectedContact.profileImage} alt={selectedContact.displayName} />
                            <AvatarFallback>{selectedContact.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <h2 className="font-semibold text-lg">{selectedContact.displayName}</h2>
                    </div>
                    <ScrollArea className="flex-1 p-6 bg-muted/20">
                        <div className="space-y-6">
                            {messagesLoading && <div className="text-center text-muted-foreground">Chargement des messages...</div>}
                            {!messagesLoading && filteredActiveMessages?.map(msg => (
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
                                     {msg.senderId === user?.id && (
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
                            <Input placeholder="Écrivez votre message..." autoComplete="off" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                            <Button type="submit" size="icon" variant="ghost" disabled={!newMessage.trim()}>
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
    </div>
    );
}

