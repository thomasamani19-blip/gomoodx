
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, collection, query, where, getDocs, or, limit, Query, and } from 'firebase-admin/firestore';
import type { User, Annonce, Product, UserRole } from '@/lib/types';

// Interface pour les entités de recherche extraites par l'IA
export interface SearchEntities {
    keywords?: string;
    location?: string;
    type?: 'profil' | 'contenu' | '';
    role?: UserRole | '';
    category?: string;
}

type SearchInput = SearchEntities & {
    types?: ('profil' | 'contenu')[];
    priceMin?: number;
    priceMax?: number;
};

// Type de sortie unifié
type SearchResult = {
  type: 'profil' | 'contenu';
  titre: string;
  description: string;
  url: string;
  imageUrl?: string;
  price?: number;
};


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
 * Performs a search against Firestore collections based on structured entities.
 * @param searchInput The search criteria including extracted entities and filters.
 * @returns A promise that resolves to an array of search results.
 */
export async function searchFirestore(searchInput: SearchInput): Promise<SearchResult[]> {
    const { keywords, location, type, role, category, types = ['profil', 'contenu'], priceMin, priceMax } = searchInput;
    const results: SearchResult[] = [];
    const searchLimit = 20;

    try {
        // --- 1. Search Users (Profiles) ---
        if (types.includes('profil') || type === 'profil') {
            let usersQuery: Query = collection(db, 'users');
            const userConditions = [];
            
            // Add role filter if specified by AI
            if (role) {
                userConditions.push(where('role', '==', role));
            } else {
                 userConditions.push(where('role', 'in', ['escorte', 'partenaire']));
            }
            
            // Add location filter if specified by user filter or AI
            if (location) {
                userConditions.push(where('city', '==', location));
            }

            // Combine conditions with AND
            if (userConditions.length > 0) {
                usersQuery = query(usersQuery, and(...userConditions), limit(searchLimit));
            } else {
                 usersQuery = query(usersQuery, limit(searchLimit));
            }
            
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => {
                const user = doc.data() as User;
                 results.push({
                    type: 'profil',
                    titre: user.displayName,
                    description: user.bio || `Profil de ${user.displayName}.`,
                    url: `/profil/${doc.id}`,
                    imageUrl: user.profileImage,
                });
            });
        }

        // --- 2. Search Content (Services and Products) ---
        if (types.includes('contenu') || type === 'contenu') {
            const contentConditions: any[] = [];
            if(category) contentConditions.push(where('category', '==', category));
            if(location) contentConditions.push(where('location', '==', location));
            if(priceMin && priceMin > 0) contentConditions.push(where('price', '>=', priceMin));
            if(priceMax && priceMax < 5000) contentConditions.push(where('price', '<=', priceMax));

            // Search Services (Annonces)
            if (contentConditions.length > 0) {
                const servicesQuery = query(collection(db, 'services'), and(...contentConditions), limit(searchLimit));
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

                // Search Products
                const productsQuery = query(collection(db, 'products'), and(...contentConditions), limit(searchLimit));
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
            } else {
                 const servicesSnapshot = await getDocs(query(collection(db, 'services'), limit(searchLimit)));
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
                 const productsSnapshot = await getDocs(query(collection(db, 'products'), limit(searchLimit)));
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
    
    // --- 3. Filter by keywords post-query ---
    let finalResults = results;
    if (keywords) {
        const lowerCaseKeywords = keywords.toLowerCase();
        finalResults = results.filter(item => 
            item.titre.toLowerCase().includes(lowerCaseKeywords) || 
            item.description.toLowerCase().includes(lowerCaseKeywords)
        );
    }
    
    const uniqueResults = Array.from(new Map(finalResults.map(item => [item.url, item])).values());
    
    // Return a randomized subset of the results to simulate relevance
    return uniqueResults.sort(() => Math.random() - 0.5).slice(0, 30);
}
