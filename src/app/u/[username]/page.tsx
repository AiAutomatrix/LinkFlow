
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { collection, query, where, getDocs, limit, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Forces fresh data on every request

// This is a robust, recursive function to safely convert Firestore data types
// to JSON-serializable formats. It correctly handles nested objects and Timestamps.
const serializeFirestoreData = (data: any): any => {
    if (data === null || data === undefined) {
        return data;
    }
    // Firestore Timestamps have a toDate() method.
    if (typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreData);
    }
    // This handles nested objects (like the 'bot' field) recursively.
    if (typeof data === 'object' && !data.nanoseconds) { // Added check to exclude Timestamps which are also objects
        const serializedData: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                serializedData[key] = serializeFirestoreData(data[key]);
            }
        }
        return serializedData;
    }
    return data;
};


async function getUserData(username: string): Promise<UserProfile | null> {
    if (!username) return null;
    const usersRef = collection(db, "users");
    // This query requires a Firestore index on the 'username' field.
    const q = query(usersRef, where("username", "==", username), limit(1));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`No user found with username: ${username}`);
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        
        // Ensure bot field exists to prevent client-side errors
        if (!userData.bot) {
            userData.bot = { embedScript: '' };
        }
        
        return userData;

    } catch (error) {
        console.error(`Error fetching user data for username: ${username}`, error);
        return null;
    }
}

async function getUserLinks(uid: string): Promise<LinkType[]> {
    const linksRef = collection(db, `users/${uid}/links`);
    const q = query(linksRef, orderBy('order'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkType));
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const userData = await getUserData(params.username);
    console.log("Fetched user data on server:", JSON.stringify(userData, null, 2));
    
    if (!userData) {
        notFound();
    }

    const allLinksData = await getUserLinks(userData.uid);

    // Serialize the data before passing it to the client component.
    const user = serializeFirestoreData(userData) as UserProfile;
    const links = allLinksData.map(link => serializeFirestoreData(link)) as LinkType[];

    return <ProfileClientPage user={user} links={links} />;
}
