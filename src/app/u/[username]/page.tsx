
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';
import { notFound } from 'next/navigation';
import { getFirestoreUser, getUserLinks } from '@/lib/firebase-utils';
import { serializeFirestoreData } from '@/lib/utils';


export const revalidate = 0; // Forces fresh data on every request

export default async function UserProfilePage({ params }: { params: { username: string } }) {
    // 1. Fetch user data using the new, robust utility function.
    const userData = await getFirestoreUser(params.username);
    
    if (!userData) {
        notFound();
    }

    // 2. Fetch the user's links using the new utility function.
    const linksData = await getUserLinks(userData.uid);

    // 3. Serialize both user and links data to safely pass to the client component.
    const user = serializeFirestoreData(userData) as UserProfile;
    const links = linksData.map(link => serializeFirestoreData(link) as LinkType);
    
    console.log("Raw Firestore userData:", JSON.stringify(userData));
    console.log("Serialized user data being passed to client:", JSON.stringify(user, null, 2));

    // 4. Pass the prepared data to the client component for rendering.
    return <ProfileClientPage user={user} links={links} />;
}
