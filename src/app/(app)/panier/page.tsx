
'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { CartItem } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PanierPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [updatingItems, setUpdatingItems] = useState<string[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const cartQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.id, 'cart'), orderBy('addedAt', 'desc'));
    }, [user, firestore]);

    const { data: cartItems, loading: cartLoading, setData: setCartItems } = useCollection<CartItem>(cartQuery);

    const subtotal = useMemo(() => {
        return cartItems?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
    }, [cartItems]);

    const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
        if (!user || newQuantity < 1) return;
        setUpdatingItems(prev => [...prev, productId]);
        try {
            const response = await fetch('/api/cart/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId, quantity: newQuantity }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            // The onSnapshot listener will handle the UI update automatically.
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setUpdatingItems(prev => prev.filter(id => id !== productId));
        }
    };
    
    const handleRemoveItem = async (productId: string) => {
        if (!user) return;
        setUpdatingItems(prev => [...prev, productId]);
        try {
             const response = await fetch('/api/cart/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            // Optimistic update for faster UI feedback
            setCartItems(prev => prev?.filter(item => item.productId !== productId) || null);
            toast({ title: "Produit retiré", description: "Le produit a été retiré de votre panier." });
        } catch (error: any) {
             toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
             setUpdatingItems(prev => prev.filter(id => id !== productId));
        }
    };
    
    const handleCheckout = async () => {
        if (!user || !cartItems || cartItems.length === 0) return;
        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast({ title: "Commande réussie !", description: "Vos commandes ont été créées. Vous pouvez les suivre dans 'Mes Réservations'." });
            router.push('/reservations');

        } catch (error: any) {
            toast({ title: "Erreur lors du paiement", description: error.message, variant: "destructive" });
        } finally {
            setIsCheckingOut(false);
        }
    }


    const loading = authLoading || cartLoading;

    return (
        <div>
            <PageHeader title="Mon Panier" />
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Articles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading && (
                                <div className="space-y-4">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            )}
                            {!loading && cartItems && cartItems.length > 0 && (
                                <div className="divide-y">
                                    {cartItems.map(item => (
                                        <div key={item.productId} className="flex items-center gap-4 py-4">
                                            <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <Link href={`/boutique/${item.productId}`} className="font-semibold hover:underline">{item.title}</Link>
                                                <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} €</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantity(item.productId, Number(e.target.value))}
                                                    className="w-16 h-9"
                                                    disabled={updatingItems.includes(item.productId)}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)} disabled={updatingItems.includes(item.productId)}>
                                                    {updatingItems.includes(item.productId) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                             {!loading && (!cartItems || cartItems.length === 0) && (
                                <div className="text-center py-16">
                                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium">Votre panier est vide</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">Parcourez la boutique pour trouver votre bonheur.</p>
                                    <Button asChild className="mt-6">
                                        <Link href="/boutique">Aller à la boutique</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Résumé de la commande</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Sous-total</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Livraison</span>
                                <span className="text-sm text-muted-foreground">Calculé à la prochaine étape</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" disabled={!cartItems || cartItems.length === 0 || isCheckingOut} onClick={handleCheckout}>
                                {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Passer à la caisse
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

