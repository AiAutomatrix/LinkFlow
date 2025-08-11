
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type SocialLink = {
    id: string;
    url: string;
    platform: 'email' | 'instagram' | 'facebook' | 'github';
    title: string;
    isSocial: boolean;
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

const toDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return null;
}

export default function ProfileClientPage({ user, links }: { user: UserProfile; links: LinkType[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [activeLinks, setActiveLinks] = useState<LinkType[]>([]);
    
    useEffect(() => {
        const now = new Date();
        const filteredLinks = links.filter(link => {
            if (!link.active || link.isSocial) return false;
    
            const startDate = toDate(link.startDate);
            const endDate = toDate(link.endDate);
            
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
    
            return true;
        }).sort((a, b) => a.order - b.order);
        
        setActiveLinks(filteredLinks);

    }, [links]);


    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }
    
    const handleLinkClick = async (link: LinkType | SocialLink) => {
        try {
            await fetch('/api/clicks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, linkId: link.id }),
            });
            // We don't show a toast on the public page for a cleaner UX
            window.open(link.url, '_blank');
        } catch (error) {
            console.error('Failed to track click:', error);
            // Still open the link even if tracking fails
            window.open(link.url, '_blank');
        }
    };
    
    const socialPlatforms: SocialLink['platform'][] = ['email', 'instagram', 'facebook', 'github'];
    const socialLinks: SocialLink[] = socialPlatforms
      .filter(platform => user.socialLinks && user.socialLinks[platform])
      .map(platform => {
        const url = platform === 'email' ? `mailto:${user.socialLinks![platform]}` : user.socialLinks![platform]!;
        return {
            id: `social_${platform}`,
            url,
            platform: platform,
            title: platform.charAt(0).toUpperCase() + platform.slice(1),
            isSocial: true,
        }
      });

    return (
        <div data-theme={user.theme || 'light'} className="relative flex flex-col items-center min-h-screen pt-12 px-4 bg-background text-foreground overflow-hidden">
            {user.animatedBackground && <AnimatedBackground />}
            <div className="w-full max-w-md mx-auto z-10">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-white/50">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold mt-4">{user.displayName}</h1>
                    <p className="text-md text-muted-foreground">@{user.username}</p>
                    <p className="mt-4 text-sm max-w-xs text-foreground/80">{user.bio}</p>

                    <div className="flex gap-4 justify-center mt-4 text-foreground/80">
                        {socialLinks.map(link => (
                            <button
                                key={link.id}
                                aria-label={`My ${link.platform}`}
                                className="hover:text-primary transition-colors"
                                onClick={() => handleLinkClick(link)}
                            >
                                <SocialIcon platform={link.platform} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                {activeLinks.map((link) => {
                    return (
                        <button 
                            key={link.id}
                            className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-[0.98] truncate"
                            onClick={() => handleLinkClick(link)}
                        >
                           {link.title}
                        </button>
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
