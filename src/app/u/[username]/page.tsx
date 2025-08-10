
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';

async function getMockUserData(username: string): Promise<UserProfile> {
    return {
        uid: 'mock-uid',
        username: username,
        email: 'demo@example.com',
        displayName: 'Demo User',
        bio: 'This is a public profile for a demo user. Add links and customize your appearance in the dashboard!',
        photoURL: '',
        plan: 'free',
        theme: 'light',
        animatedBackground: true,
        socialLinks: {
            email: "demo@example.com",
            github: "https://github.com"
        },
        createdAt: new Date().toISOString()
    };
}

async function getMockUserLinks(uid: string): Promise<LinkType[]> {
    return [
        { id: '1', title: 'My Awesome Link', url: '#', order: 0, active: true, clicks: 123 },
        { id: '2', title: 'Another Link', url: '#', order: 1, active: true, clicks: 456 },
        { id: '3', title: 'Inactive Link', url: '#', order: 2, active: false, clicks: 789 },
        { id: 'social_email', url: 'mailto:demo@example.com', title: 'Email', order: -1, clicks: 1, active: true, isSocial: true },
        { id: 'social_github', url: 'https://github.com', title: 'Github', order: -1, clicks: 2, active: true, isSocial: true },
    ];
}


export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const user = await getMockUserData(params.username);
    const links = await getMockUserLinks(user.uid);

    return <ProfileClientPage user={user} links={links} />;
}
