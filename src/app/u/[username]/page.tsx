
import { notFound } from 'next/navigation';
import { getFirestoreUser, getUserLinks } from '@/lib/firebase-utils';
import { serializeFirestoreData } from '@/lib/utils';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';


export const revalidate = 0; // Forces fresh data on every request

export default async function UserProfilePage({ params }: { params: { username: string } }) {
    // 1. Fetch user data using the robust utility function.
    const userData = await getFirestoreUser(params.username);
    
    // 2. If no user is found, render the 404 page.
    if (!userData) {
        notFound();
    }

    // 3. Fetch the user's links using the utility function.
    const linksData = await getUserLinks(userData.uid);

    // 4. Serialize both user and links data to safely pass to the client component.
    const user = serializeFirestoreData(userData) as UserProfile;
    const links = linksData.map(link => serializeFirestoreData(link) as LinkType);
    
    // 5. Pass the prepared data to the client component for rendering.
    return <ProfileClientPage user={user} links={links} />;
}
