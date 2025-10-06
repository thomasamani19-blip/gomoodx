/**
 * DEV SCRIPT: DO NOT USE IN PRODUCTION
 * This script seeds the Firestore database with some initial data for development.
 * Usage: npx tsx src/lib/seed.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import type { PartnerType } from './types';

// IMPORTANT: Replace with your Firebase config from the Firebase console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

const USERS_TO_CREATE = [
    {
        email: 'amanignangoran104@gmail.com',
        password: 'password123',
        data: {
            displayName: 'Amani Gnangoran',
            role: 'founder',
        }
    },
    {
        email: 'admin@test.com',
        password: 'password123',
        data: {
            displayName: 'Admin GoMoodX',
            role: 'administrateur',
        }
    },
    {
        email: 'creator@test.com',
        password: 'password123',
        data: {
            displayName: 'Eva Sensuelle',
            role: 'escorte',
            profileImage: 'https://picsum.photos/seed/creator1/400/600',
        }
    },
    {
        email: 'member@test.com',
        password: 'password123',
        data: {
            displayName: 'Alexandre',
            role: 'client',
             profileImage: 'https://picsum.photos/seed/user1/100/100',
        }
    },
      {
        email: 'member2@test.com',
        password: 'password123',
        data: {
            displayName: 'Julien',
            role: 'client',
            profileImage: 'https://picsum.photos/seed/user2/100/100',
        }
    },
    {
        email: 'partner@test.com',
        password: 'password123',
        data: {
            displayName: 'Hôtel Plaza',
            role: 'partenaire',
            partnerType: 'establishment',
            profileImage: 'https://picsum.photos/seed/partner1/400/400'
        }
    },
    {
        email: 'producer@test.com',
        password: 'password123',
        data: {
            displayName: 'Studio Vision',
            role: 'partenaire',
            partnerType: 'producer',
            profileImage: 'https://picsum.photos/seed/producer1/400/400'
        }
    },
     {
        email: 'moderator@test.com',
        password: 'password123',
        data: {
            displayName: 'Modérateur',
            role: 'moderator',
        }
    }
];

async function seedDatabase() {
    console.log('Starting database seeding...');
    const userIds: { [key: string]: { uid: string, displayName: string, profileImage: string } } = {};
    
    try {
        for (const user of USERS_TO_CREATE) {
            try {
                console.log(`Creating auth user: ${user.email}`);
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                const uid = userCredential.user.uid;
                
                const profileImage = (user.data as any).profileImage || `https://picsum.photos/seed/${uid}/150/150`;

                userIds[user.email] = {
                    uid,
                    displayName: user.data.displayName,
                    profileImage,
                };
                
                console.log(`User created with UID: ${uid}. Now creating Firestore document...`);

                const batch = writeBatch(firestore);

                const userDocRef = doc(firestore, 'users', uid);
                const baseData: any = {
                    displayName: user.data.displayName,
                    email: user.email,
                    role: user.data.role,
                    status: 'active',
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    rewardPoints: 0,
                    referralsCount: 0,
                    isVerified: true,
                    onlineStatus: 'offline',
                    lastLogin: Timestamp.now(),
                    referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                    profileImage: profileImage,
                    bio: 'Description de profil par défaut.',
                    favorites: [],
                    dateOfBirth: '1990-01-01', // Default DOB
                };

                if (user.data.role === 'partenaire') {
                    baseData.partnerType = (user.data as any).partnerType as PartnerType;
                }

                batch.set(userDocRef, baseData);

                // Create wallet for each user
                const walletRef = doc(firestore, 'wallets', uid);
                batch.set(walletRef, {
                    balance: Math.floor(Math.random() * 200),
                    currency: 'EUR',
                    totalEarned: 0,
                    totalSpent: 0,
                    status: 'active'
                });

                await batch.commit();
                console.log(`Firestore document and wallet created for ${user.email}`);

            } catch (error: any) {
                 if (error.code === 'auth/email-already-in-use') {
                    console.warn(`Auth user ${user.email} already exists. Skipping auth creation.`);
                 } else {
                    console.error(`Error creating user ${user.email}:`, error.message);
                 }
            }
        }
        
        console.log("\nSeeding additional data (services, products)...");

        const creatorUid = userIds['creator@test.com']?.uid || 'creator-uid-placeholder';

        // Example service
        const serviceRef = doc(collection(firestore, 'services'));
        await setDoc(serviceRef, {
            title: 'Dîner Privé aux Chandelles',
            description: 'Une soirée inoubliable en ma compagnie, où tous vos sens seront en éveil.',
            price: 450,
            category: 'rencontre',
            imageUrl: 'https://picsum.photos/seed/diner/800/600',
            imageHint: 'romantic dinner',
            createdBy: creatorUid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: 'active',
            location: 'Paris, FR',
            rating: 4.8,
            ratingCount: 15,
            views: 1250,
        });

         // Add reviews to the service
        const alexandre = userIds['member@test.com'];
        const julien = userIds['member2@test.com'];
        
        if (alexandre) {
            const review1Ref = doc(collection(firestore, 'services', serviceRef.id, 'reviews'));
            await setDoc(review1Ref, {
                authorId: alexandre.uid,
                authorName: alexandre.displayName,
                authorImage: alexandre.profileImage,
                rating: 5,
                comment: 'Une expérience absolument incroyable. Eva est une hôte charmante et attentionnée. Je recommande vivement !',
                createdAt: Timestamp.now(),
            });
        }
        
         if (julien) {
            const review2Ref = doc(collection(firestore, 'services', serviceRef.id, 'reviews'));
            await setDoc(review2Ref, {
                authorId: julien.uid,
                authorName: julien.displayName,
                authorImage: julien.profileImage,
                rating: 4,
                comment: "Très bonne soirée, l'ambiance était parfaite. Juste un petit bémol sur la ponctualité, mais rien de grave.",
                createdAt: Timestamp.now(),
            });
        }

        
        // Example product
        const productRef = doc(collection(firestore, 'products'));
        await setDoc(productRef, {
            title: 'Bougie de Massage Sensuelle',
            description: 'Une bougie parfumée qui se transforme en huile de massage chaude et enivrante.',
            price: 35,
            imageUrl: 'https://picsum.photos/seed/bougie/600/600',
            imageHint: 'massage candle',
            createdBy: creatorUid,
            createdAt: Timestamp.now(),
            productType: 'physique',
        });

        const product2Ref = doc(collection(firestore, 'products'));
        await setDoc(product2Ref, {
            title: 'Vidéo Exclusive "Secrets de Nuit"',
            description: 'Un court-métrage artistique et sensuel à regarder en privé.',
            price: 25,
            imageUrl: 'https://picsum.photos/seed/secret-video/600/400',
            imageHint: 'sensual video',
            createdBy: creatorUid,
            createdAt: Timestamp.now(),
            productType: 'digital',
        });

        // Example blog post
        const blogRef = doc(collection(firestore, 'blog'));
        await setDoc(blogRef, {
            title: 'L\'Art de la Séduction Moderne',
            content: 'Découvrez les secrets pour captiver et charmer à l\'ère du numérique. Un guide pour les audacieux et les curieux.',
            imageUrl: 'https://picsum.photos/seed/blog1/800/600',
            imageHint: 'seduction art',
            date: Timestamp.now(),
            authorName: 'Eva Sensuelle'
        });

        // Example Live Session
        const liveRef = doc(collection(firestore, 'lives'));
        await setDoc(liveRef, {
            title: 'Live Spécial "Confidences"',
            description: 'Un moment intime pour discuter de tout, sans tabou.',
            isPublic: true,
            startTime: Timestamp.now(),
            viewersCount: 0,
            likes: 0,
            status: 'ended',
            imageUrl: 'https://picsum.photos/seed/live1/800/600',
            imageHint: 'intimate conversation',
            creatorName: 'Eva Sensuelle'
        });

        console.log('\nDatabase seeding completed successfully!');

    } catch (error) {
        console.error('An error occurred during seeding:', error);
    }
}

seedDatabase().then(() => {
    process.exit(0);
}).catch(() => {
    process.exit(1);
});
