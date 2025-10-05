/**
 * DEV SCRIPT: DO NOT USE IN PRODUCTION
 * This script seeds the Firestore database with some initial data for development.
 * Usage: npx tsx src/lib/seed.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
        email: 'admin@gomoodx.com',
        password: 'password123',
        data: {
            displayName: 'Amani Gnangoran',
            role: 'admin',
            status: 'active',
            verified: true,
            premium: true,
            walletBalance: 9999,
            about: 'Lead administrator of GoMoodX.',
            country: 'FR',
        }
    },
    {
        email: 'creator@gomoodx.com',
        password: 'password123',
        data: {
            displayName: 'Eva Sensuelle',
            role: 'creator',
            status: 'active',
            verified: true,
            premium: true,
            walletBalance: 2500,
            about: 'Artiste sensuelle explorant les limites du désir.',
            country: 'FR',
            gender: 'female',
        }
    },
    {
        email: 'member@gomoodx.com',
        password: 'password123',
        data: {
            displayName: 'Alexandre',
            role: 'member',
            status: 'active',
            verified: true,
            premium: false,
            walletBalance: 75,
            about: 'Explorateur des plaisirs modernes.',
            country: 'FR',
            gender: 'male',
        }
    },
];

async function seedDatabase() {
    console.log('Starting database seeding...');

    try {
        for (const user of USERS_TO_CREATE) {
            try {
                console.log(`Creating auth user: ${user.email}`);
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                const uid = userCredential.user.uid;
                console.log(`User created with UID: ${uid}. Now creating Firestore document...`);

                const userDocRef = doc(firestore, 'users', uid);
                await setDoc(userDocRef, {
                    ...user.data,
                    uid: uid,
                    email: user.email,
                    createdAt: Timestamp.now(),
                });
                console.log(`Firestore document created for ${user.email}`);
            } catch (error: any) {
                 if (error.code === 'auth/email-already-in-use') {
                    console.warn(`Auth user ${user.email} already exists. Skipping auth creation.`);
                 } else {
                    console.error(`Error creating user ${user.email}:`, error.message);
                 }
            }
        }
        
        console.log("\nSeeding additional data (services, products)...");

        // Example service
        const serviceRef = doc(collection(firestore, 'services'));
        await setDoc(serviceRef, {
            serviceId: serviceRef.id,
            creatorId: 'PLACEHOLDER_CREATOR_UID', // Replace with actual creator UID after creation
            title: 'Dîner Privé aux Chandelles',
            description: 'Une soirée inoubliable en ma compagnie, où tous vos sens seront en éveil.',
            price: 450,
            category: 'rencontre',
            duration: 180,
            images: ['https://picsum.photos/seed/diner/800/600'],
            isActive: true,
            createdAt: Timestamp.now(),
        });
        
        // Example product
        const productRef = doc(collection(firestore, 'products'));
        await setDoc(productRef, {
            productId: productRef.id,
            creatorId: 'PLACEHOLDER_CREATOR_UID', // Replace with actual creator UID after creation
            title: 'Bougie de Massage Sensuelle',
            description: 'Une bougie parfumée qui se transforme en huile de massage chaude et enivrante.',
            price: 35,
            stock: 50,
            category: 'accessoires',
            images: ['https://picsum.photos/seed/bougie/600/600'],
            isActive: true,
            createdAt: Timestamp.now(),
        });
        
        // Example Live Session
        const liveRef = doc(collection(firestore, 'liveSessions'));
        await setDoc(liveRef, {
            sessionId: liveRef.id,
            creatorId: 'PLACEHOLDER_CREATOR_UID',
            title: 'Live Spécial "Confidences"',
            description: 'Un moment intime pour discuter de tout, sans tabou.',
            pricePerMinute: 2.99,
            isLive: false,
        });

        console.log('\nDatabase seeding completed successfully!');
        console.log('NOTE: Remember to replace PLACEHOLDER_CREATOR_UID in sample data with a real creator UID.');

    } catch (error) {
        console.error('An error occurred during seeding:', error);
    }
}

seedDatabase().then(() => {
    process.exit(0);
}).catch(() => {
    process.exit(1);
});
