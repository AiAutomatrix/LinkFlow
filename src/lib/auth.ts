
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateFirebaseAuthProfile,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, limit, getDocs, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Signs in a user with Google using a popup window.
 * This is generally more reliable than redirects as it doesn't navigate the user away.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account" // Ensures account selector always appears
    });
    try {
        await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener in AuthProvider will handle the user creation/redirect.
    } catch (error: any) {
        // Handle specific errors, like popup closed by user
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("Google Sign-In popup closed by user.");
            // We can re-throw or handle it silently
            throw new Error("Sign-in process was canceled.");
        }
        console.error("Google sign-in error:", error);
        throw error; // Re-throw other errors to be caught by the UI
    }
}

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
        // User profile already exists, return it.
        return { uid: user.uid, ...userSnap.data() } as UserProfile;
    } else {
        // This is a new user, create their profile.
        let username = user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
        username = username.replace(/[^a-z0-9_]/g, '').slice(0, 15);
        
        let finalUsername = username;
        let attempts = 0;
        
        // Keep trying to generate a unique username if the proposed one is taken
        while (await isUsernameTaken(finalUsername)) {
            attempts++;
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
            finalUsername = `${username.slice(0, 10)}_${randomSuffix}`;
            if (attempts > 5) { // Failsafe to prevent infinite loops
                finalUsername = `user_${user.uid.slice(0, 8)}`;
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

        // After creation, fetch the document to get the server-generated timestamp
        const newUserSnap = await getDoc(userRef);
        return { uid: user.uid, ...newUserSnap.data() } as UserProfile;
    }
}

/**
 * Creates a new user with email and password, and sets up their profile in Firestore.
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Update Firebase auth profile display name
    await updateFirebaseAuthProfile(user, { displayName });
    // This will create the profile in Firestore via the onAuthStateChanged listener
    return user;
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
 * Updates the user's profile photo URL in their Firestore document and Auth profile.
 */
export async function updateUserProfilePhoto(userUid: string, photoURL: string) {
    const userRef = doc(db, "users", userUid);
    await updateDoc(userRef, { photoURL });

    // Also update the photoURL in the Firebase Auth user profile
    if (auth.currentUser && auth.currentUser.uid === userUid) {
        await updateFirebaseAuthProfile(auth.currentUser, { photoURL });
    }
}
