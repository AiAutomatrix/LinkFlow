
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type SocialLink = {
    id: string;
    url: string;
    platform: 'email' | 'instagram' | 'facebook' | 'github';
    title: string;
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
    const { toast } = useToast();
    const router = useRouter();

    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }

    const now = new Date();
    
    const handleLinkClick = async (link: LinkType) => {
        try {
            // In a real app, this API call would be secured and robust.
            await fetch('/api/clicks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, linkId: link.id }),
            });
            toast({
                title: "Redirecting...",
                description: `You clicked on "${link.title}".`
            });
            // Open link in a new tab
            window.open(link.url, '_blank');
        } catch (error) {
            console.error('Failed to track click:', error);
            // Still redirect user even if tracking fails
             window.open(link.url, '_blank');
        }
    };
    
    const socialPlatforms: SocialLink['platform'][] = ['email', 'instagram', 'facebook', 'github'];
    const socialLinks: SocialLink[] = socialPlatforms
      .filter(platform => user.socialLinks && user.socialLinks[platform])
      .map(platform => ({
        id: `social_${platform}`,
        url: user.socialLinks![platform]!,
        platform: platform,
        title: platform.charAt(0).toUpperCase() + platform.slice(1) // Capitalize title
      }));


    const activeLinks = links.filter(link => {
        if (!link.active || link.isSocial) return false;

        const startDate = link.startDate ? new Date(link.startDate as string) : null;
        const endDate = link.endDate ? new Date(link.endDate as string) : null;

        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;

        return true;
    });


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
                                    handleLinkClick(link as LinkType); // Cast to LinkType
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
                            className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98] link-button truncate" 
                            variant="secondary"
                             onClick={() => handleLinkClick(link)}
                        >
                           {link.title}
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
