'use client';

import { doc, setDoc, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from '@/lib/types';

/**
 * Met à jour les données du profil d'un utilisateur dans Firestore.
 * @param firestore - L'instance Firestore.
 * @param userId - L'ID de l'utilisateur à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export function updateUserProfile(
  firestore: Firestore,
  userId: string,
  data: Partial<Omit<User, 'id'>>
) {
  const userRef = doc(firestore, 'users', userId);

  // Pas de await ici, on utilise .catch() pour la gestion d'erreur non bloquante.
  setDoc(userRef, data, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    
    // Émettre l'erreur via l'émetteur d'erreurs global.
    errorEmitter.emit('permission-error', permissionError);
    // L'erreur est ensuite interceptée par FirebaseErrorListener pour afficher un toast.
  });
}
