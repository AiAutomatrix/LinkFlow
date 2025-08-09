
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import Link from 'next/link';

export default function ProfileClientPage({ user, links }: { user: UserProfile; links: LinkType[] }) {
    
    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
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
                {links.map((link) => {
                    const redirectUrl = `/redirect?userId=${user.uid}&linkId=${link.id}&url=${encodeURIComponent(link.url)}`;
                    return (
                        <Button 
                            key={link.id}
                            asChild
                            className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98] link-button" 
                            variant="secondary"
                        >
                            <Link href={redirectUrl}>
                                {link.title}
                            </Link>
                        </Button>
                    )
                })}
                </div>
            </div>
            <footer className="mt-auto py-8">
                <Logo />
            </footer>
        </div>
    );
}
