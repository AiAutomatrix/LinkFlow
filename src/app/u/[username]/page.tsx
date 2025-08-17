
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { collection, query, where, getDocs, limit, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

// Helper function to safely convert Firestore Timestamps and nested objects to serializable structures.
const serializeFirestoreData = (data: any): any => {
    if (data === null || data === undefined || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }
    
    // This is a Firestore GeoPoint, DocumentReference, etc.
    // We can't serialize it, so we'll just remove it.
    if (typeof data.isEqual === 'function') {
        return undefined;
    }
    
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreData);
    }
    
    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            // Firebase Timestamps have a toDate method. This is a reliable check.
            if (value && typeof value.toDate === 'function') {
                serializedData[key] = value.toDate().toISOString();
            } else {
                // Recursively serialize nested objects
                serializedData[key] = serializeFirestoreData(value);
            }
        }
    }
    return serializedData;
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
    
    if (!userData) {
        notFound();
    }

    const allLinksData = await getUserLinks(userData.uid);

    // Serialize the data before passing it to the client component.
    const user = serializeFirestoreData(userData) as UserProfile;
    const links = allLinksData.map(link => serializeFirestoreData(link)) as LinkType[];

    return <ProfileClientPage user={user} links={links} />;
}
