'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
import { addDoc, collection, serverTimestamp, query, where, orderBy, or } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessageriePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    // Fetch potential contacts (all users except the current one)
    const { data: users, loading: usersLoading } = useCollection<User>('users');
    const contacts = useMemo(() => users?.filter(u => u.id !== user?.id), [users, user]);
    
    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');

    const conversationId = useMemo(() => {
        if (!user || !selectedContact) return null;
        return [user.id, selectedContact.id].sort().join('_');
    }, [user, selectedContact]);

    const { data: messages, loading: messagesLoading } = useCollection<Message>(
        'messages',
        {
            constraints: conversationId ? [where('conversationId', '==', conversationId), orderBy('timestamp', 'asc')] : undefined
        }
    );

    const handleSelectContact = (contact: User) => {
        setSelectedContact(contact);
    }

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedContact || !conversationId) return;

        const messageData = {
            conversationId,
            content: newMessage,
            senderId: user.id,
            receiverId: selectedContact.id,
            timestamp: serverTimestamp(),
            read: false,
        };

        try {
            await addDoc(collection(firestore, 'messages'), messageData);
            setNewMessage('');
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
        }
    };
    
    const loading = authLoading || usersLoading;

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
                {!loading && contacts?.map(contact => (
                    <button 
                        key={contact.id} 
                        className={cn(
                            "flex items-center gap-4 p-4 w-full text-left hover:bg-accent/50",
                            selectedContact?.id === contact.id && "bg-accent"
                        )}
                        onClick={() => handleSelectContact(contact)}
                    >
                        <Avatar>
                            <AvatarImage src={contact.avatar} alt={contact.nom} />
                            <AvatarFallback>{contact.nom.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{contact.nom}</p>
                            <p className="text-sm text-muted-foreground truncate">{contact.role}</p>
                        </div>
                    </button>
                ))}
            </ScrollArea>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
            {selectedContact ? (
                <>
                    <div className="p-4 border-b flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={selectedContact.avatar} alt={selectedContact.nom} />
                            <AvatarFallback>{selectedContact.nom.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="font-semibold text-lg">{selectedContact.nom}</h2>
                    </div>
                    <ScrollArea className="flex-1 p-6 bg-muted/20">
                        <div className="space-y-6">
                            {messagesLoading && <p>Chargement des messages...</p>}
                            {!messagesLoading && messages?.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.id ? 'justify-end' : '')}>
                                    {msg.senderId !== user?.id && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedContact.avatar} />
                                            <AvatarFallback>{selectedContact.nom.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 max-w-sm break-words",
                                        msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-card border'
                                    )}>
                                        <p>{msg.content}</p>
                                    </div>
                                     {msg.senderId === user?.id && user?.avatar && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.nom.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
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
                        <h3 className="mt-4 text-lg font-medium">Sélectionnez un contact</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Choisissez un utilisateur dans la liste pour commencer à discuter.</p>
                    </div>
                </div>
            )}
        </div>
      </Card>
    </div>
    );
}
