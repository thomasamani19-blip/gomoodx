'use client';

import {
  doc,
  onSnapshot,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

function useMemoizedDocRef(firestore: Firestore, path: string | null) {
  return useMemo(() => (path ? doc(firestore, path) : null), [firestore, path]);
}

export const useDoc = <T extends DocumentData>(path: string | null) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemoizedDocRef(firestore, path);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          // In a real app, you might want to handle this case differently.
          // For the prototype, we can inject mock data if the doc doesn't exist.
          if (docRef.path.startsWith('users/escorte-uid/wallet')) {
             setData({
              id: 'main',
              balance: 150.75,
              history: [
                { id: 'tx1', type: 'deposit', amount: 200, date: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Dépôt initial" },
                { id: 'tx2', type: 'purchase', amount: 49.25, date: new Date(Date.now() - 86400000).toISOString(), description: "Achat de contenu" },
              ]
            } as T);
          } else if (docRef.path.startsWith('users/')) {
             setData({
                id: docRef.id,
                name: 'Marie Dubois',
                email: 'marie.dubois@example.com',
                role: 'escorte',
                avatar: 'https://picsum.photos/seed/avatar1/100/100'
             } as T)
          }
          else {
            setData(null);
          }
        }
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
};
