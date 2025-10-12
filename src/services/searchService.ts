
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, collection, query, where, getDocs, or, limit } from 'firebase-admin/firestore';
import type { User, Annonce, Product } from '@/lib/types';
import type { RechercheMultilingueOutput } from '@/ai/flows/recherche-multilingue';

// Initialize Firebase Admin SDK if not already done
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: applicationDefault(),
    });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);


/**
 * Performs a search against Firestore collections based on a query string.
 * This is a simplified search for prototype purposes. A real-world application
 * should use a dedicated search service like Algolia or Elasticsearch.
 * @param searchQuery The string to search for.
 * @returns A promise that resolves to an array of search results.
 */
export async function searchFirestore(searchQuery: string): Promise<RechercheMultilingueOutput> {
    const searchTerm = searchQuery.toLowerCase();
    const results: RechercheMultilingueOutput = [];
    const searchLimit = 10; // Limit per collection

    try {
        // 1. Search Users (Creators and Partners) by displayName and city
        const usersQuery = query(
            collection(db, 'users'),
            or(
                where('displayName', '>=', searchTerm),
                where('displayName', '<=', searchTerm + '\uf8ff'),
                where('city', '==', searchTerm)
            ),
            limit(searchLimit)
        );
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
            const user = doc.data() as User;
            if ((user.role === 'escorte' || user.role === 'partenaire')) {
                results.push({
                    type: 'profil',
                    titre: user.displayName,
                    description: user.bio || `Profil de ${user.displayName}.`,
                    url: `/profil/${doc.id}`,
                });
            }
        });

        // 2. Search Services (Annonces) by title, category, and location
        const servicesQuery = query(
            collection(db, 'services'),
            or(
                where('title', '>=', searchTerm),
                where('title', '<=', searchTerm + '\uf8ff'),
                where('category', '==', searchTerm),
                where('location', '==', searchTerm)
            ),
            limit(searchLimit)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        servicesSnapshot.forEach(doc => {
            const annonce = doc.data() as Annonce;
            results.push({
                type: 'contenu',
                titre: annonce.title,
                description: annonce.description,
                url: `/annonces/${doc.id}`,
            });
        });
        
        // 3. Search Products by title
        const productsQuery = query(
            collection(db, 'products'),
            where('title', '>=', searchTerm),
            where('title', '<=', searchTerm + '\uf8ff'),
            limit(searchLimit)
        );
        const productsSnapshot = await getDocs(productsQuery);
        productsSnapshot.forEach(doc => {
            const product = doc.data() as Product;
            results.push({
                type: 'contenu',
                titre: product.title,
                description: product.description,
                url: `/boutique/${doc.id}`,
            });
        });

    } catch (error) {
        console.error("Error searching Firestore:", error);
        // En cas d'erreur (ex: index manquant), retourner un tableau vide pour ne pas planter l'app.
        return [];
    }
    
    // De-duplicate results based on URL and limit total results
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    
    return uniqueResults.slice(0, 20);
}
