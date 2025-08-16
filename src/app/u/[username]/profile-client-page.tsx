
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github, Coffee, Banknote, Bitcoin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const SocialIcon = ({ platform }: { platform: string }) => {
    switch (platform.toLowerCase()) {
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

const SupportLinks = ({ user }: { user: UserProfile }) => {
    const { toast } = useToast();
    const { supportLinks } = user;

    if (!supportLinks || Object.values(supportLinks).every(v => !v)) {
        return null;
    }
    
    const trackSupportClick = (platform: string) => {
        try {
          fetch('/api/clicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, linkId: `support_${platform}` }),
          });
        } catch (error) {
          console.error('Failed to track support click:', error);
        }
    };
    
    const copyToClipboard = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        trackSupportClick(platform);
        toast({ title: "Copied to clipboard!"});
    }

    return (
        <div className="mt-8 w-full max-w-md mx-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-3">Support Me</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supportLinks.buyMeACoffee && (
                    <a href={supportLinks.buyMeACoffee} target="_blank" rel="noopener noreferrer" onClick={() => trackSupportClick('buyMeACoffee')} className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Coffee className="h-5 w-5" /> Buy Me a Coffee
                    </a>
                )}
                {supportLinks.email && (
                     <button onClick={() => copyToClipboard(supportLinks.email!, 'email')} className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Banknote className="h-5 w-5" /> E-Transfer
                    </button>
                )}
                 {supportLinks.btc && (
                     <button onClick={() => copyToClipboard(supportLinks.btc!, 'btc')} className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Bitcoin className="h-5 w-5" /> Bitcoin
                    </button>
                )}
            </div>
        </div>
    );
};

export default function ProfileClientPage({ user, links: serverLinks }: { user: UserProfile; links: LinkType[] }) {
    const [activeLinks, setActiveLinks] = useState<LinkType[]>([]);

    useEffect(() => {
      const now = new Date();
      const filteredLinks = serverLinks.filter(link => {
          if (!link.active) return false;

          const startDate = toDate(link.startDate);
          const endDate = toDate(link.endDate);
          
          if (startDate && now < startDate) return false;
          if (endDate && now > endDate) return false;

          return true;
      });
      setActiveLinks(filteredLinks);
    }, [serverLinks]);


    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }
    
    const handleLinkClick = async (link: LinkType) => {
        try {
          fetch('/api/clicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, linkId: link.id }),
          });
        } catch (error) {
          console.error('Failed to track click:', error);
        }
        window.open(link.url, '_blank', 'noopener,noreferrer');
    };
    
    const socialLinks = activeLinks.filter(l => l.isSocial);
    const regularLinks = activeLinks.filter(l => !l.isSocial);

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
                                aria-label={`My ${link.title}`}
                                className="hover:text-primary transition-colors"
                                onClick={() => handleLinkClick(link)}
                            >
                                <SocialIcon platform={link.title} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                {regularLinks.map((link) => {
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

                <SupportLinks user={user} />
            </div>
            <footer className="mt-auto py-8 z-10">
                <Logo />
            </footer>
        </div>
    );
}
