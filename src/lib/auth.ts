
import { auth, firestore, storage } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection, query, where, limit } from 'firebase/firestore';
import type { UserProfile } from './types';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


const googleProvider = new GoogleAuthProvider();

/**
 * Creates a user profile document in Firestore if one doesn't already exist.
 * This is called after any successful sign-in or sign-up.
 * @param user The Firebase user object.
 * @returns The user's profile data.
 */
export const getOrCreateUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
  const userRef = doc(firestore, `users/${user.uid}`);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { uid: user.uid, ...userSnap.data() } as UserProfile;
  }

  // User is new, create a profile.
  const { uid, email, displayName, photoURL } = user;
  const username = email?.split('@')[0] || uid; // Basic username generation

  const newUserProfile: UserProfile = {
    uid,
    email: email || '',
    displayName: displayName || 'New User',
    username,
    photoURL: photoURL || '',
    bio: '',
    plan: 'free',
    theme: 'light',
    animatedBackground: false,
    socialLinks: {},
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, newUserProfile);
  
  // We re-fetch the doc to get the object with the server-generated timestamp
  const newUserSnap = await getDoc(userRef);
  return { uid: user.uid, ...newUserSnap.data() } as UserProfile;
};


/**
 * Signs a user in with email and password.
 */
export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs a user up with email and password.
 */
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName });
  // The AuthProvider's onAuthStateChanged will handle profile creation
};


/**
 * Initiates the Google Sign-In flow via a popup.
 */
export const signInWithGoogle = async (): Promise<void> => {
    try {
        await signInWithPopup(auth, googleProvider);
        // The AuthProvider's onAuthStateChanged will handle the result and profile creation.
    } catch (error: any) {
        // Don't re-throw popup closed errors
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        throw error;
    }
};

/**
 * Signs the current user out.
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Uploads a new profile picture to Firebase Storage.
 * @param userId The user's UID.
 * @param file The file to upload.
 * @returns The public URL of the uploaded image.
 */
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.type.startsWith("image/")) throw new Error("File is not an image.");

    const storageRef = ref(storage, `profile_pictures/${userId}/profile.jpg`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};
