// /src/app/api/jobs/update-creator-stats/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { User, Transaction, CreatorStats } from '@/lib/types';
import { subDays, startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

// This API route simulates a scheduled Cloud Function.
// In a real production environment, you would deploy this logic as a Cloud Function
// and trigger it with Cloud Scheduler (e.g., once every 24 hours).
// To trigger it manually for testing, you can call this endpoint.

let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({ credential: applicationDefault() });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

async function calculateStatsForCreator(creatorId: string): Promise<CreatorStats> {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);

    // --- Revenue ---
    const transactionsRef = collection(db, 'wallets', creatorId, 'transactions');
    const revenueQuery = query(transactionsRef, where('type', '==', 'credit'), where('createdAt', '>=', thirtyDaysAgo));
    const revenueSnapshot = await getDocs(revenueQuery);
    const monthlyRevenue = revenueSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    // --- Subscribers (simplified) ---
    // A real implementation would require a dedicated "subscriptions" collection with timestamps.
    // We'll simulate this with a small random number for now.
    const newSubscribers = Math.floor(Math.random() * 5);

    // --- Profile Views (simplified) ---
    // This would typically come from an analytics service or a dedicated "views" collection.
    const profileViews = Math.floor(Math.random() * 500) + 50;

    // --- Content Sales (simplified) ---
    const salesQuery = query(transactionsRef, where('type', '==', 'credit'), where('createdAt', '>=', thirtyDaysAgo));
    const salesSnapshot = await getDocs(salesQuery);
    const contentSales = salesSnapshot.size;

    // --- Histories for charts ---
    const revenueHistory = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthName = format(date, 'MMM', { locale: fr });
        // Simulate historical revenue, in a real app you'd query per month
        const monthlyTotal = (monthlyRevenue / 6) * (6 - i) * (Math.random() * 0.4 + 0.8);
        revenueHistory.push({ month: monthName, revenue: Math.max(0, monthlyTotal) });
    }

    const viewsHistory = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayName = format(date, 'd/MM');
        viewsHistory.push({ date: dayName, views: Math.floor(Math.random() * (profileViews / 5)) + 10 });
    }
    
    const salesHistory = [];
     for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayName = format(date, 'd/MM');
        salesHistory.push({ date: dayName, sales: Math.floor(Math.random() * (contentSales / 3)) });
    }


    const subscribersHistory = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayName = format(date, 'd/MM');
        subscribersHistory.push({ date: dayName, new: Math.floor(Math.random() * 2) });
    }

    const stats: CreatorStats = {
        monthlyRevenue: { value: monthlyRevenue, change: Math.random() * 20 - 10 },
        newSubscribers: { value: newSubscribers, change: Math.random() > 0.5 ? 1 : -1 },
        profileViews: { value: profileViews, change: Math.random() * 30 - 15 },
        contentSales: { value: contentSales, change: Math.random() > 0.5 ? 2 : -1 },
        engagementRate: { value: Math.random() * 5 + 2, change: Math.random() * 2 - 1 },
        revenueHistory,
        viewsHistory,
        subscribersHistory,
        salesHistory
    };

    return stats;
}


export async function GET(request: Request) {
  try {
    console.log("Starting creator stats update job...");
    
    const creatorsQuery = query(db.collection('users'), where('role', 'in', ['escorte', 'partenaire']));
    const creatorsSnapshot = await getDocs(creatorsQuery);

    if (creatorsSnapshot.empty) {
        return NextResponse.json({ status: 'success', message: 'No creators found to update.' });
    }

    let updatedCount = 0;
    for (const creatorDoc of creatorsSnapshot.docs) {
        const creatorId = creatorDoc.id;
        console.log(`Calculating stats for creator: ${creatorId}`);
        
        const newStats = await calculateStatsForCreator(creatorId);

        const statsDocRef = doc(db, `creators/${creatorId}/stats/main`);
        await setDoc(statsDocRef, newStats, { merge: true });
        
        updatedCount++;
        console.log(`Successfully updated stats for creator: ${creatorId}`);
    }

    const message = `Successfully updated stats for ${updatedCount} creator(s).`;
    console.log(message);
    return NextResponse.json({ status: 'success', message });

  } catch (error: any) {
    console.error("Error during creator stats update:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
