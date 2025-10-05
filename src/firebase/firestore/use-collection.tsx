// src/lib/firestore/use-collection.tsx
'use client';

import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Firestore,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface UseCollectionOptions {
  constraints?: QueryConstraint[];
  listen?: boolean;
}

function useMemoizedQuery(
  firestore: Firestore,
  path: string,
  options?: UseCollectionOptions
) {
  return useMemo(() => {
    const { constraints } = options ?? {};
    if (!path) return null;
    const ref = collection(firestore, path);
    return constraints ? query(ref, ...constraints) : ref;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, path, JSON.stringify(options?.constraints)]);
}

export const useCollection = <T extends DocumentData>(
  path: string | null,
  options?: UseCollectionOptions
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryObj = useMemoizedQuery(firestore, path, options);

  useEffect(() => {
    if (!queryObj) {
      setData(null);
      setLoading(false);
      return;
    }

    const { listen = true } = options ?? {};

    const unsubscribe = onSnapshot(
      queryObj,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: (queryObj as Query).path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryObj, options]);

  return { data, loading, error };
};
