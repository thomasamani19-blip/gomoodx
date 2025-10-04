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
    const ref = collection(firestore, path);
    return constraints ? query(ref, ...constraints) : ref;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, path, JSON.stringify(options?.constraints)]);
}

export const useCollection = <T extends DocumentData>(
  path: string,
  options?: UseCollectionOptions
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const query = useMemoizedQuery(firestore, path, options);

  useEffect(() => {
    const { listen = false } = options ?? {};

    const unsubscribe = onSnapshot(
      query,
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
          path: (query as Query).path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, options]);

  return { data, loading, error };
};
