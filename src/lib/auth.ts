
import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithRedirect,
    updateProfile as updateFirebaseAuthProfile,
    signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Creates a new user with email and password, and sets up their profile in Firestore.
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user profile in Firestore
    const username = (displayName.split(' ')[0] + Math.random().toString(36).substring(2, 6)).toLowerCase();
    
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName,
        username: username,
        email: user.email,
        photoURL: null,
        bio: "",
        theme: "light",
        animatedBackground: false,
        socialLinks: {},
        plan: "free",
        createdAt: serverTimestamp(),
    });
    
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
