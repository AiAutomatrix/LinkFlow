
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
 * This is the sole method for Google Auth now. It's simple and direct.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account" // Ensures account selector always appears
    });
    console.log("Attempting to sign in with Google...");
    try {
        // signInWithPopup handles the entire flow.
        // The result is handled by the onAuthStateChanged listener in AuthProvider.
        await signInWithPopup(auth, provider);
        console.log("signInWithPopup successful. Auth state change should be handled by listener.");
    } catch (error: any) {
        // The UI will catch and display these errors.
        if (error.code === 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error: Popup closed by user.");
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
    console.log(`Checking if username '${username}' is taken...`);
    const q = query(collection(db, "users"), where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);
    const isTaken = !querySnapshot.empty;
    console.log(`Username '${username}' is taken: ${isTaken}`);
    return isTaken;
}

/**
 * Creates a new user profile document in Firestore ONLY if one doesn't already exist.
 * If the user exists, it fetches and returns their existing profile.
 * This function is called centrally by AuthProvider.
 */
export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
    console.log(`[getOrCreateUserProfile] Starting for user: ${user.uid}`);
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        console.log(`[getOrCreateUserProfile] Found existing profile for user: ${user.uid}`);
        const profile = { uid: user.uid, ...userSnap.data() } as UserProfile;
        console.log("[getOrCreateUserProfile] Returning existing profile:", profile);
        return profile;
    } else {
        console.log(`[getOrCreateUserProfile] No existing profile found for user: ${user.uid}. Creating new one.`);
        let username = user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
        username = username.replace(/[^a-z0-9_]/g, '').slice(0, 15);
        
        let finalUsername = username;
        let attempts = 0;
        
        while (await isUsernameTaken(finalUsername)) {
            attempts++;
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            finalUsername = `${username.slice(0, 10)}_${randomSuffix}`;
            console.log(`[getOrCreateUserProfile] Username taken, trying new username: ${finalUsername}`);
            if (attempts > 5) {
                finalUsername = `user_${user.uid.slice(0, 8)}`;
                console.log(`[getOrCreateUserProfile] Max attempts reached, using fallback username: ${finalUsername}`);
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
            socialLinks: { email: '', instagram: '', facebook: '', github: '' },
            plan: 'free',
            createdAt: serverTimestamp(),
        };
        
        console.log(`[getOrCreateUserProfile] Creating new profile document for ${user.uid} with data:`, newUserProfile);
        await setDoc(userRef, newUserProfile);
        const newUserSnap = await getDoc(userRef);
        const createdProfile = { uid: user.uid, ...newUserSnap.data() } as UserProfile;
        console.log("[getOrCreateUserProfile] Returning newly created profile:", createdProfile);
        return createdProfile;
    }
}

/**
 * Signs up a new user with email and password.
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateFirebaseAuthProfile(user, { displayName });
    // onAuthStateChanged in AuthProvider will handle the profile creation.
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
