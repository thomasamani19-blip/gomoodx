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
  constraints?: QueryConstraint[] | null;
  listen?: boolean;
}

function useMemoizedQuery(
  firestore: Firestore,
  pathOrQuery: string | null | Query,
  options?: UseCollectionOptions
) {
  return useMemo(() => {
    if (!pathOrQuery) return null;

    if (typeof pathOrQuery !== 'string') {
      return pathOrQuery;
    }
    
    const { constraints } = options ?? {};
    const ref = collection(firestore, pathOrQuery);
    // Firestore's query() function is variadic, so we can spread the constraints array.
    // If constraints is undefined, it's like calling query(ref).
    return query(ref, ...(constraints || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, pathOrQuery, JSON.stringify(options?.constraints)]);
}

export const useCollection = <T extends DocumentData>(
  pathOrQuery: string | null | Query,
  options?: UseCollectionOptions
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryObj = useMemoizedQuery(firestore, pathOrQuery, options);

  useEffect(() => {
    if (!queryObj) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { listen = true } = options ?? {};

    if (!listen) {
        // Not implemented: one-time fetch (getDocs)
        // For now, we only support real-time listeners.
        // The implementation would be similar to onSnapshot but using getDocs.
        console.warn("useCollection currently only supports real-time listeners. 'listen: false' is not implemented.");
        setLoading(false);
        return;
    }

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
          path: queryObj.path,
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
