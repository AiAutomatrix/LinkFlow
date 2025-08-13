
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { collection, query, where, getDocs, limit, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

// Helper function to safely convert Firestore Timestamps to serializable strings
// This is necessary because Server Components can't pass complex objects to Client Components.
const serializeFirestoreData = (data: any): any => {
    if (!data) return data;
    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreData);
    }
    if (typeof data === 'object') {
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
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    // We already have the user data, just need to add the id.
    const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    return userData;
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
