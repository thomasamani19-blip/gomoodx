
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, collection, query, where, getDocs, or, limit, Query } from 'firebase-admin/firestore';
import type { User, Annonce, Product } from '@/lib/types';
import type { RechercheMultilingueInput, RechercheMultilingueOutput } from '@/ai/flows/recherche-multilingue';

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
 * Performs a search against Firestore collections based on a query string and filters.
 * @param searchInput The search criteria including query string and filters.
 * @returns A promise that resolves to an array of search results.
 */
export async function searchFirestore(searchInput: Partial<RechercheMultilingueInput>): Promise<RechercheMultilingueOutput> {
    const { query: searchQuery, types = ['profil', 'contenu'], priceMin = 0, priceMax = 5000, location } = searchInput;
    const searchTerm = searchQuery?.toLowerCase();
    const results: RechercheMultilingueOutput = [];
    const searchLimit = 20;

    try {
        // 1. Search Users
        if (types.includes('profil')) {
            let usersQuery: Query = collection(db, 'users');
            const userConditions = [];
            
            if (searchTerm) {
                 userConditions.push(where('displayName', '>=', searchTerm));
                 userConditions.push(where('displayName', '<=', searchTerm + '\uf8ff'));
            }
             if (location) {
                userConditions.push(where('city', '==', location.toLowerCase()));
            }

            if (userConditions.length > 0) {
                 usersQuery = query(usersQuery, or(...userConditions), limit(searchLimit));
                 const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => {
                    const user = doc.data() as User;
                    if ((user.role === 'escorte' || user.role === 'partenaire')) {
                        results.push({
                            type: 'profil',
                            titre: user.displayName,
                            description: user.bio || `Profil de ${user.displayName}.`,
                            url: `/profil/${doc.id}`,
                            imageUrl: user.profileImage,
                        });
                    }
                });
            }
        }

        // 2. Search Content (Services and Products)
        if (types.includes('contenu')) {
            const serviceClauses = [];
            if (searchTerm) {
                 serviceClauses.push(where('title', '>=', searchTerm));
                 serviceClauses.push(where('title', '<=', searchTerm + '\uf8ff'));
            }
            if (location) serviceClauses.push(where('location', '==', location));
            if (priceMin > 0) serviceClauses.push(where('price', '>=', priceMin));
            if (priceMax < 5000) serviceClauses.push(where('price', '<=', priceMax));

            if(serviceClauses.length > 0) {
                const servicesQuery = query(collection(db, 'services'), ...serviceClauses, limit(searchLimit));
                const servicesSnapshot = await getDocs(servicesQuery);
                servicesSnapshot.forEach(doc => {
                    const annonce = doc.data() as Annonce;
                    results.push({
                        type: 'contenu',
                        titre: annonce.title,
                        description: annonce.description,
                        url: `/annonces/${doc.id}`,
                        imageUrl: annonce.imageUrl,
                        price: annonce.price
                    });
                });
            }

            const productClauses = [];
             if (searchTerm) {
                 productClauses.push(where('title', '>=', searchTerm));
                 productClauses.push(where('title', '<=', searchTerm + '\uf8ff'));
            }
            if (priceMin > 0) productClauses.push(where('price', '>=', priceMin));
            if (priceMax < 5000) productClauses.push(where('price', '<=', priceMax));

            if(productClauses.length > 0) {
                const productsQuery = query(collection(db, 'products'), ...productClauses, limit(searchLimit));
                const productsSnapshot = await getDocs(productsQuery);
                productsSnapshot.forEach(doc => {
                    const product = doc.data() as Product;
                     results.push({
                        type: 'contenu',
                        titre: product.title,
                        description: product.description,
                        url: `/boutique/${doc.id}`,
                        imageUrl: product.imageUrl,
                        price: product.price
                    });
                });
            }
        }

    } catch (error) {
        console.error("Error searching Firestore:", error);
        return [];
    }
    
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    
    return uniqueResults.sort(() => Math.random() - 0.5).slice(0, 30);
}
