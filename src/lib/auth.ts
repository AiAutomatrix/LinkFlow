
'use client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Uploads a profile picture to Firebase Storage and returns the URL.
 * @param uid The user's unique ID.
 * @param file The image file to upload.
 * @returns The public URL of the uploaded image.
 */
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `profile_pictures/${uid}/profile.jpg`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    return photoURL;
};
