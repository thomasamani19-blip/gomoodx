

'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, updateDoc, doc } from 'firebase/firestore';
import type { Call } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import IncomingCallNotification from '@/components/features/calls/incoming-call-notification';
import { useRouter } from 'next/navigation';

function CallListener() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Query for incoming calls for the current user
  const callsQuery = useMemo(() => {
    if (!user || loading || !firestore) return null;
    return query(
      collection(firestore, 'calls'),
      where('receiverId', '==', user.id),
      where('status', '==', 'pending')
    );
  }, [user, loading, firestore]);

  const { data: calls } = useCollection<Call>(callsQuery);

  // Set the first incoming call to state
  useEffect(() => {
    if (calls && calls.length > 0 && !incomingCall) {
      setIncomingCall(calls[0]);
    }
  }, [calls, incomingCall]);

  const handleAcceptCall = async () => {
    if (!incomingCall || !firestore) return;
    const callRef = doc(firestore, 'calls', incomingCall.id);
    await updateDoc(callRef, { status: 'ongoing' });
    setIncomingCall(null);
    router.push(`/appels/${incomingCall.id}`);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall || !firestore) return;
    const callRef = doc(firestore, 'calls', incomingCall.id);
    await updateDoc(callRef, { status: 'declined' });
    setIncomingCall(null);
  };
  
  return (
      <IncomingCallNotification 
        call={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/95">
            {children}
          </main>
        </div>
      </div>
      <CallListener />
    </SidebarProvider>
  );
}
