'use client';

import { useState, useMemo } from 'react';
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
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MessageriePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');

    // 1. Fetch all messages involving the current user
    const { data: allUserMessages, loading: messagesLoading } = useCollection<Message>(
        'messages',
        user ? {
            constraints: [or(where('senderId', '==', user.id), where('receiverId', '==', user.id))]
        } : undefined
    );
    
    // 2. Fetch all users to map IDs to user data
    const { data: users, loading: usersLoading } = useCollection<User>('users');

    // 3. Create a list of recent contacts and last messages
    const recentContacts = useMemo(() => {
        if (!allUserMessages || !users || !user) return [];

        const userMap = new Map(users.map(u => [u.id, u]));
        const conversations = new Map<string, { contact: User; lastMessage: Message }>();

        // Sort messages to find the most recent one for each conversation
        const sortedMessages = [...allUserMessages].sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

        sortedMessages.forEach(msg => {
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

        return Array.from(conversations.values());

    }, [allUserMessages, users, user]);


    const conversationId = useMemo(() => {
        if (!user || !selectedContact) return null;
        return [user.id, selectedContact.id].sort().join('_');
    }, [user, selectedContact]);
    
    // 4. Filter messages for the selected conversation
    const activeMessages = useMemo(() => {
        if (!conversationId || !allUserMessages) return [];
        return allUserMessages
            .filter(msg => msg.conversationId === conversationId)
            .sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    }, [conversationId, allUserMessages]);


    const handleSelectContact = (contact: User) => {
        setSelectedContact(contact);
    }

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedContact || !conversationId || !firestore) return;

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
                {!loading && recentContacts?.map(({contact, lastMessage}) => (
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
                            <p className="text-sm text-muted-foreground truncate">{lastMessage.content}</p>
                        </div>
                         {lastMessage.timestamp && (
                           <span className="text-xs text-muted-foreground ml-auto">
                            {formatDistanceToNow(lastMessage.timestamp.toDate(), { addSuffix: true, locale: fr })}
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
                            <AvatarImage src={selectedContact.avatar} alt={selectedContact.nom} />
                            <AvatarFallback>{selectedContact.nom.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="font-semibold text-lg">{selectedContact.nom}</h2>
                    </div>
                    <ScrollArea className="flex-1 p-6 bg-muted/20">
                        <div className="space-y-6">
                            {messagesLoading && <div className="text-center text-muted-foreground">Chargement...</div>}
                            {!messagesLoading && activeMessages?.map(msg => (
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
