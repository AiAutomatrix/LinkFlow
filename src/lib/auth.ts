'use client';
import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    signOut as firebaseSignOut, 
    updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type { UserProfile } from './types';


export const signInWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName });

    // The AuthProvider's onAuthStateChanged listener will handle creating the Firestore document
    // This function just needs to create the auth user.
    return userCredential;
};

export const signOut = async () => {
    return firebaseSignOut(auth);
};


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