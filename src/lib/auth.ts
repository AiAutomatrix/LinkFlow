
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateFirebaseAuthProfile,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Signs in a user with Google using a popup window.
 * This function now relies on the persistence set in firebase.ts.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account"
    });
    try {
        await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener in AuthProvider will handle the result.
    } catch (error: any) {
        // The UI will catch and display these errors.
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("Login was canceled.");
        }
        console.error("Google sign-in error:", error.code, error.message);
        throw new Error("Failed to sign in with Google.");
    }
}

/**
 * Checks if a username is already taken.
 */
async function isUsernameTaken(username: string): Promise<boolean> {
    const q = query(collection(db, "users"), where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Creates a new user profile document in Firestore ONLY if one doesn't already exist.
 * If the user exists, it fetches and returns their existing profile.
 */
export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        console.log("Existing user profile found for:", user.uid);
        return { uid: user.uid, ...userSnap.data() } as UserProfile;
    } else {
        console.log("No existing profile, creating new one for:", user.uid);
        let username = user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
        username = username.replace(/[^a-z0-9_]/g, '').slice(0, 15);
        
        let finalUsername = username;
        let attempts = 0;
        
        // Ensure the generated username is unique.
        while (await isUsernameTaken(finalUsername)) {
            attempts++;
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            finalUsername = `${username.slice(0, 10)}_${randomSuffix}`;
            if (attempts > 5) {
                // Fallback to a highly unique username if conflicts persist.
                finalUsername = `user_${user.uid.slice(0, 8)}`;
                break;
            }
        }
        console.log("Generated username:", finalUsername);

        const newUserProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'New User',
            username: finalUsername,
            email: user.email || '',
            photoURL: user.photoURL || '',
            bio: '',
            theme: 'light',
            animatedBackground: false,
            socialLinks: { email: '', instagram: '', facebook: '', github: '' },
            plan: 'free',
            createdAt: serverTimestamp(),
        };
        
        await setDoc(userRef, newUserProfile);
        const newUserSnap = await getDoc(userRef);
        console.log("New user profile created successfully.");
        return { uid: user.uid, ...newUserSnap.data() } as UserProfile;
    }
}

/**
 * Signs up a new user with email and password.
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateFirebaseAuthProfile(user, { displayName });
    // getOrCreateUserProfile will be called by the onAuthStateChanged listener
    return user;
}


/**
 * Signs in a user with their email and password.
 */
export async function signInWithEmail(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // getOrCreateUserProfile will be called by the onAuthStateChanged listener
    return userCredential.user;
}

/**
 * Uploads a profile picture to Firebase Storage.
 */
export async function uploadProfilePicture(userUid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `profile_pictures/${userUid}/profile.jpg`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

/**
 * Updates the user's profile photo URL in Firestore and Auth.
 */
export async function updateUserProfilePhoto(userUid: string, photoURL: string) {
    const userRef = doc(db, "users", userUid);
    await updateDoc(userRef, { photoURL });
    if (auth.currentUser && auth.currentUser.uid === userUid) {
        await updateFirebaseAuthProfile(auth.currentUser, { photoURL });
    }
}
