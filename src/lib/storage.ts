'use client';

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useStorage } from "@/firebase"; // Assuming useStorage hook is available

/**
 * Uploads a user's avatar to Firebase Storage.
 * @param uid The user's ID.
 * @param file The file to upload.
 * @param storage The Firebase Storage instance.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
    // This function must be called from a component where the useStorage hook is available.
    // For simplicity in this context, we're assuming it's being called correctly,
    // but in a real app you might pass the storage instance as an argument.
    // However, to use the hook, we must follow rules of hooks. A better pattern would be:
    
    // In your component:
    // const storage = useStorage();
    // const handleUpload = async () => {
    //     const url = await uploadAvatar(storage, uid, file);
    //     ...
    // }
    
    // For now, this is a conceptual placeholder of where the logic would go.
    // The implementation in the page component will get the storage instance via the hook.
    
    const storagePath = `avatars/${uid}/${file.name}`;
    const storageRef = ref(getStorage(), storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
};

// We need to adjust how we get the storage instance.
// A better approach is to pass storage as an argument, since this is not a React component or hook.

import { type FirebaseStorage } from "firebase/storage";

export const uploadFile = async (storage: FirebaseStorage, path: string, file: File): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}
