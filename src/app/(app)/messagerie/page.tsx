'use client';

import { useState } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conversation, Message } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

// Données factices pour la démonstration
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantName: 'Isabelle',
    participantAvatar: 'https://images.unsplash.com/photo-1615538785945-6625ccdb4b25?w=100&h=100&fit=crop',
    lastMessage: 'On se voit ce soir ?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'conv-2',
    participantName: 'Chloé',
    participantAvatar: 'https://images.unsplash.com/photo-1627577279497-4b24bf1021b6?w=100&h=100&fit=crop',
    lastMessage: 'J\'ai adoré notre dernière discussion !',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
    {
    id: 'conv-3',
    participantName: 'Sofia',
    participantAvatar: 'https://images.unsplash.com/photo-1723291875355-cc9be3c07a76?w=100&h=100&fit=crop',
    lastMessage: 'Tu es libre demain ?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const mockMessages: { [key: string]: Message[] } = {
  'conv-1': [
    { id: 'msg-1-1', content: 'Hey ! Comment ça va ?', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), sender: 'Isabelle' },
    { id: 'msg-1-2', content: 'Très bien et toi ? Prête pour ce soir ?', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), sender: 'me' },
    { id: 'msg-1-3', content: 'On se voit ce soir ?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), sender: 'Isabelle' },
  ],
  'conv-2': [
    { id: 'msg-2-1', content: 'J\'ai adoré notre dernière discussion !', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), sender: 'Chloé' },
  ],
  'conv-3': [
      { id: 'msg-3-1', content: 'Tu es libre demain ?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), sender: 'Sofia' },
  ]
};


export default function MessageriePage() {
    const { user } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
    const [messages, setMessages] = useState<Message[]>(selectedConversation ? mockMessages[selectedConversation.id] : []);

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        setMessages(mockMessages[conv.id] || []);
    }

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
                    <Input placeholder="Rechercher une conversation..." className="pl-10" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {mockConversations.map(conv => (
                    <button 
                        key={conv.id} 
                        className={cn(
                            "flex items-center gap-4 p-4 w-full text-left hover:bg-accent/50",
                            selectedConversation?.id === conv.id && "bg-accent"
                        )}
                        onClick={() => handleSelectConversation(conv)}
                    >
                        <Avatar>
                            <AvatarImage src={conv.participantAvatar} alt={conv.participantName} />
                            <AvatarFallback>{conv.participantName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{conv.participantName}</p>
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                    </button>
                ))}
            </ScrollArea>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
            {selectedConversation ? (
                <>
                    <div className="p-4 border-b flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} />
                            <AvatarFallback>{selectedConversation.participantName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="font-semibold text-lg">{selectedConversation.participantName}</h2>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'me' ? 'justify-end' : '')}>
                                    {msg.sender !== 'me' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedConversation.participantAvatar} />
                                            <AvatarFallback>{selectedConversation.participantName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 max-w-sm",
                                        msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    )}>
                                        <p>{msg.content}</p>
                                    </div>
                                     {msg.sender === 'me' && user?.avatar && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t mt-auto">
                        <form className="flex items-center gap-2">
                            <Input placeholder="Écrivez votre message..." autoComplete="off" />
                            <Button type="submit" size="icon" variant="ghost">
                                <Send className="h-5 w-5 text-primary" />
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Sélectionnez une conversation pour commencer.</p>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}