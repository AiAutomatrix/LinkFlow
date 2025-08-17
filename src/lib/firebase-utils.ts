
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, Link } from './types';

/**
 * Fetches a user profile from Firestore by their username.
 * Requires a Firestore index on the 'username' field in the 'users' collection.
 * @param username The user's public username.
 * @returns A UserProfile object or null if not found.
 */
export async function getFirestoreUser(username: string): Promise<UserProfile | null> {
    if (!username) return null;
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username), limit(1));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log(`No user found with username: ${username}`);
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;

        // **Critical Fix**: Always ensure a bot object exists on the user profile.
        // This prevents serialization errors and ensures the client page
        // always receives the expected data structure.
        if (!userData.bot) {
            userData.bot = { embedScript: '' };
        }
        
        return userData;

    } catch (error) {
        console.error(`Error fetching user data for username: ${username}`, error);
        return null;
    }
}

/**
 * Fetches all links for a given user ID, ordered by the 'order' field.
 * @param uid The user's unique ID (UID).
 * @returns An array of Link objects.
 */
export async function getUserLinks(uid: string): Promise<Link[]> {
    if (!uid) return [];
    
    const linksRef = collection(db, `users/${uid}/links`);
    const q = query(linksRef, orderBy('order'));
    
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
    } catch (error) {
        console.error(`Error fetching links for user: ${uid}`, error);
        return [];
    }
}
