
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github } from 'lucide-react';

type SocialLink = {
    id: string;
    url: string;
    platform: 'email' | 'instagram' | 'facebook' | 'github';
};

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
    switch (platform) {
        case 'email': return <Mail className="h-6 w-6" />;
        case 'instagram': return <Instagram className="h-6 w-6" />;
        case 'facebook': return <Facebook className="h-6 w-6" />;
        case 'github': return <Github className="h-6 w-6" />;
        default: return null;
    }
};

export default function ProfileClientPage({ user, links }: { user: UserProfile; links: LinkType[] }) {
    
    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }

    const now = new Date();
    
    // Separate regular links from social links by filtering the main links array
    const regularLinks = links.filter(link => !link.isSocial);
    const socialLinks: SocialLink[] = links
      .filter(link => link.isSocial && link.id.startsWith('social_'))
      .map(link => ({
        id: link.id,
        url: link.url,
        platform: link.id.replace('social_', '') as SocialLink['platform']
      }));


    const activeLinks = regularLinks.filter(link => {
        if (!link.active) return false;

        const startDate = link.startDate ? new Date(link.startDate as string) : null;
        const endDate = link.endDate ? new Date(link.endDate as string) : null;

        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;

        return true;
    });

    const handleLinkClick = (userId: string, linkId: string, url: string) => {
        // We prevent the default navigation so we can first send the click event
        // This is primarily for regular links which navigate away from the page
        
        // Send the click event in the background
        fetch(`/api/clicks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, linkId }),
          keepalive: true, // Important for requests that might outlive the page
        });

        // Open the link in a new tab
        window.open(url, '_blank');
    };


    return (
        <div data-theme={user.theme || 'light'} className="relative flex flex-col items-center min-h-screen pt-12 px-4 bg-background text-foreground overflow-hidden">
            {user.animatedBackground && <AnimatedBackground />}
            <div className="w-full max-w-md mx-auto z-10">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-white">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold mt-4">{user.displayName}</h1>
                    <p className="text-md text-muted-foreground">@{user.username}</p>
                    <p className="mt-4 text-sm max-w-xs text-foreground/80">{user.bio}</p>

                    <div className="flex gap-4 justify-center mt-4 text-foreground/80">
                        {socialLinks.map(link => (
                            <a
                                key={link.id}
                                aria-label={`My ${link.platform}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleLinkClick(user.uid, link.id, link.url);
                                }}
                            >
                                <SocialIcon platform={link.platform} />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                {activeLinks.map((link) => {
                    return (
                        <Button 
                            key={link.id}
                            asChild
                            className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98] link-button" 
                            variant="secondary"
                        >
                            <a href={link.url} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               onClick={(e) => {
                                 e.preventDefault();
                                 handleLinkClick(user.uid, link.id, link.url);
                               }}>
                                {link.title}
                            </a>
                        </Button>
                    )
                })}
                </div>
            </div>
            <footer className="mt-auto py-8 z-10">
                <Logo />
            </footer>
        </div>
    );
}
