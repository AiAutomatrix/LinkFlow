
import ProfileClientPage from './profile-client-page';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { serializeFirestoreData } from '@/lib/utils';

// This is the key change: It forces Next.js to treat this page as
// fully dynamic, disabling all caching and ensuring data is fetched
// fresh from Firestore on every single request.
export const revalidate = 0;

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
        
        // Ensure bot field exists to prevent client-side errors.
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
    
    if (!userData) {
        notFound();
    }

    const allLinksData = await getUserLinks(userData.uid);

    // Serialize the data before passing it to the client component.
    const user = serializeFirestoreData(userData) as UserProfile;
    const links = allLinksData.map(link => serializeFirestoreData(link)) as LinkType[];

    return <ProfileClientPage user={user} links={links} />;
}
