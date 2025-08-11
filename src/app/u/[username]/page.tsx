
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

// Helper function to safely convert Firestore Timestamps to serializable strings
const serializeFirestoreTimestamps = (data: any) => {
    if (!data) return data;
    const serializedData = { ...data };
    for (const key in serializedData) {
        if (serializedData[key] instanceof Timestamp) {
            serializedData[key] = serializedData[key].toDate().toISOString();
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
    
    // Manually add the uid to the profile data as it's the document ID
    return { uid: userDoc.id, ...userData } as UserProfile;
}

async function getUserLinks(uid: string): Promise<LinkType[]> {
    const linksRef = collection(db, `users/${uid}/links`);
    const q = query(linksRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkType));
}


export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const userData = await getUserData(params.username);
    
    if (!userData) {
        notFound();
    }

    const linksData = await getUserLinks(userData.uid);

    // Serialize the data before passing it to the client component
    const user = serializeFirestoreTimestamps(userData) as UserProfile;
    const links = linksData.map(link => serializeFirestoreTimestamps(link)) as LinkType[];

    return <ProfileClientPage user={user} links={links} />;
}
