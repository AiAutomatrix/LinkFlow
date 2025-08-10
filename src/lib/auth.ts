
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  updateProfile as updateFirebaseAuthProfile,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Checks if a username is already taken.
 * @param username The username to check.
 * @returns True if the username exists, false otherwise.
 */
async function isUsernameTaken(username: string): Promise<boolean> {
    const q = query(collection(db, "users"), where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Creates a new user profile document in Firestore ONLY if one doesn't already exist.
 * If the user exists, it fetches and returns their existing profile.
 * @param user The Firebase Auth user object.
 * @returns The user's profile data.
 */
export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    } else {
        // Create a unique username proposal
        let username = user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
        username = username.slice(0, 15); // Truncate to a reasonable length
        
        let finalUsername = username;
        let attempts = 0;
        
        // Keep trying to generate a unique username
        while (await isUsernameTaken(finalUsername)) {
            attempts++;
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            finalUsername = `${username.slice(0, 14 - randomSuffix.length)}${randomSuffix}`;
            if (attempts > 5) { // Failsafe
                finalUsername = `user_${user.uid.slice(0, 6)}`;
                break;
            }
        }

        const newUserProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'New User',
            username: finalUsername,
            email: user.email || '',
            photoURL: user.photoURL || '',
            bio: '',
            theme: 'light',
            animatedBackground: false,
            socialLinks: {
              email: '',
              instagram: '',
              facebook: '',
              github: ''
            },
            plan: 'free',
            createdAt: serverTimestamp(),
        };
        
        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    }
}

/**
 * Creates a new user with email and password, and sets up their profile in Firestore.
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await getOrCreateUserProfile(user); // This will create the profile
    return user;
}

/**
 * Signs in a user with Google using the redirect method.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
}

/**
 * Signs in a user with their email and password.
 */
export async function signInWithEmail(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Uploads a profile picture to Firebase Storage.
 * @returns The public download URL of the uploaded image.
 */
export async function uploadProfilePicture(userUid: string, file: File): Promise<string> {
    // Use a consistent file name, like 'profile.jpg', to overwrite the existing one.
    const storageRef = ref(storage, `profile_pictures/${userUid}/profile.jpg`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

/**
 * Updates the user's profile photo URL in their Firestore document.
 */
export async function updateUserProfilePhoto(userUid: string, photoURL: string) {
    const userRef = doc(db, "users", userUid);
    await updateDoc(userRef, { photoURL });

    // Also update the photoURL in the Firebase Auth user profile
    if (auth.currentUser && auth.currentUser.uid === userUid) {
        await updateFirebaseAuthProfile(auth.currentUser, { photoURL });
    }
}
