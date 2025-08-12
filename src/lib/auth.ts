
import {
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseAuthProfile,
  signInWithEmailAndPassword,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { UserProfile } from "./types";

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
    console.log("getOrCreateUserProfile: Called for user:", user.uid);
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        console.log("getOrCreateUserProfile: Existing user profile found.");
        return { uid: user.uid, ...userSnap.data() } as UserProfile;
    } else {
        console.log("getOrCreateUserProfile: No existing profile. Creating new one.");
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
        console.log("getOrCreateUserProfile: Final username:", finalUsername);

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
        console.log("getOrCreateUserProfile: New profile created in Firestore.");
        const newUserSnap = await getDoc(userRef);
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
 * Signs in or signs up a user using their Google account via a popup.
 */
export async function signInWithGoogle() {
    console.log("signInWithGoogle: Initiating popup sign-in.");
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("signInWithGoogle: Popup successful. User:", result.user.displayName);
        // The onAuthStateChanged listener in AuthProvider will handle the profile
        // creation and redirection automatically because persistence is now correctly set.
        return result.user;
    } catch (error) {
        console.error("signInWithGoogle: Popup sign-in failed.", error);
        // Re-throw the error so the calling component can handle it.
        throw error;
    }
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
