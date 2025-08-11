
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { collection, query, where, getDocs, limit, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

// Helper function to safely convert Firestore Timestamps to serializable strings
// This is necessary because Server Components can't pass complex objects to Client Components.
const serializeFirestoreData = (data: any) => {
    if (!data) return data;

    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            // Convert Timestamp to a plain ISO string
            serializedData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively serialize nested objects
            serializedData[key] = serializeFirestoreData(value);
        } else {
            serializedData[key] = value;
        }
    }
    return serializedData;
};


async function getUserData(username: string): Promise<UserProfile | null> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    return { uid: userDoc.id, ...userData } as UserProfile;
}

async function getUserLinks(uid: string): Promise<LinkType[]> {
    const linksRef = collection(db, `users/${uid}/links`);
    const q = query(linksRef, orderBy('order'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkType));
}

const toDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return null;
}


export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const userData = await getUserData(params.username);
    
    if (!userData) {
        notFound();
    }

    const linksData = await getUserLinks(userData.uid);

    // --- Server-side filtering ---
    const now = new Date();
    const activeLinksData = linksData.filter(link => {
        if (!link.active || link.isSocial) return false;

        const startDate = toDate(link.startDate);
        const endDate = toDate(link.endDate);
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;

        return true;
    });
    // --- End server-side filtering ---

    // Serialize the data before passing it to the client component to avoid server/client mismatch errors.
    const user = serializeFirestoreData(userData) as UserProfile;
    const activeLinks = activeLinksData.map(link => serializeFirestoreData(link)) as LinkType[];

    return <ProfileClientPage user={user} activeLinks={activeLinks} />;
}
