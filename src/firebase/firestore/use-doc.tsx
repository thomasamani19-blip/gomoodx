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

function useMemoizedDocRef(firestore: Firestore, path: string) {
  return useMemo(() => doc(firestore, path), [firestore, path]);
}

export const useDoc = <T extends DocumentData>(path: string) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemoizedDocRef(firestore, path);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
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
