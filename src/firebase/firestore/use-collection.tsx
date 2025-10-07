
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  collectionGroup,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' and 'path' field to a given type T. */
export type WithIdAndPath<T> = T & { id: string, path: string };

/**
 * Interface for the return value of the useCollection and useCollectionGroup hooks.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithIdAndPath<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  setData: React.Dispatch<React.SetStateAction<WithIdAndPath<T>[] | null>>;
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

function useBaseCollection<T>(
    targetRefOrQuery: Query<DocumentData> | null | undefined
): UseCollectionResult<T> {
  type ResultItemType = WithIdAndPath<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id, path: doc.ref.path }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
         const path: string = (targetRefOrQuery as unknown as InternalQuery)._query.path?.canonicalString() || 'unknown path';
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery]);

  return { data, isLoading, error, setData };
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 */
export function useCollection<T = any>(
    targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined
): UseCollectionResult<T> {
    return useBaseCollection<T>(targetRefOrQuery);
}

/**
 * React hook to subscribe to a Firestore collection group query in real-time.
 */
export function useCollectionGroup<T = any>(
    targetRefOrQuery: Query<DocumentData> | null | undefined
): UseCollectionResult<T> {
    return useBaseCollection<T>(targetRefOrQuery);
}
