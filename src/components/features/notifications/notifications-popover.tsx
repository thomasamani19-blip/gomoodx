
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { Notification } from '@/lib/types';
import { collection, query, where, orderBy, limit, writeBatch, getDocs } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationsPopover() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const notificationsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'notifications'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
    }, [user, firestore]);

    const { data: notifications, loading: notificationsLoading, setData } = useCollection<Notification>(notificationsQuery);
    const unreadCount = useMemo(() => notifications?.filter(n => !n.isRead).length || 0, [notifications]);

    const handleMarkAllAsRead = async () => {
        if (!user || !firestore || !notifications || unreadCount === 0) return;
        setIsMarkingAllAsRead(true);

        const unreadNotifIds = notifications.filter(n => !n.isRead).map(n => n.id);

        try {
            const response = await fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, notificationIds: unreadNotifIds }),
            });
            if (!response.ok) throw new Error('Failed to mark notifications as read.');
            
            // Optimistic update
            setData(prev => prev?.map(n => ({ ...n, isRead: true })) || null);

        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setIsMarkingAllAsRead(false);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        router.push(notification.link);
        if (!notification.isRead) {
            fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, notificationIds: [notification.id] }),
            });
             setData(prev => prev?.map(n => n.id === notification.id ? { ...n, isRead: true } : n) || null);
        }
    }

    if (authLoading) {
        return (
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
            </Button>
        );
    }
    
    if (!user) return null;


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-primary text-primary-foreground">{unreadCount}</span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAllAsRead || unreadCount === 0}
                    >
                        {isMarkingAllAsRead ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Tout marquer comme lu'}
                    </Button>
                </div>
                <ScrollArea className="h-96">
                    <div className="p-2">
                        {notificationsLoading && <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>}
                        {!notificationsLoading && notifications && notifications.length > 0 ? (
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg hover:bg-accent flex items-start gap-3",
                                        !notification.isRead && "font-semibold"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {!notification.isRead && <span className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />}
                                    <div className={cn("flex-1", notification.isRead && "pl-4")}>
                                        <p className="text-sm">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(notification.createdAt.toDate(), { locale: fr, addSuffix: true })}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                Vous n'avez aucune notification.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

