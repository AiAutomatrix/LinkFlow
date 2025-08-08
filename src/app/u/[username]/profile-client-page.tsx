
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

export default function ProfileClientPage({ user, links }: { user: UserProfile; links: LinkType[] }) {
    
    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }

    const handleLinkClick = async (linkId: string, url: string) => {
        if (!user) return;
        try {
            // Fire and forget, no need to await
            fetch('/api/clicks', {
                method: 'POST',
                body: JSON.stringify({ userId: user.uid, linkId }),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
            });
        } catch (error) {
            console.error("Failed to record click", error);
        }

        // Open link in a new tab for a better user experience
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    return (
        <div data-theme={user.theme || 'light'} className="flex flex-col items-center min-h-screen pt-12 px-4 bg-background text-foreground">
            <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-white">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold mt-4">{user.displayName}</h1>
                    <p className="text-md text-muted-foreground">@{user.username}</p>
                    <p className="mt-4 text-sm max-w-xs text-foreground/80">{user.bio}</p>
                </div>

                <div className="mt-8 space-y-4">
                {links.map((link) => (
                    <Button 
                        key={link.id}
                        onClick={() => handleLinkClick(link.id, link.url)}
                        className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98] link-button" 
                        variant="secondary"
                    >
                        {link.title}
                    </Button>
                ))}
                </div>
            </div>
            <footer className="mt-auto py-8">
                <Logo />
            </footer>
        </div>
    );
}
