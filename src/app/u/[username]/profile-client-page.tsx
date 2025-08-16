
"use client";

import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github, Coffee, Banknote, Bitcoin, ClipboardCopy, ClipboardCheck } from 'lucide-react';
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

const EthIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0"><title>Ethereum</title><path d="M11.944 17.97L4.58 13.62 11.943 24l7.365-10.38-7.364 4.35zM12.056 0L4.69 12.223l7.366-4.354 7.365 4.354L12.056 0z"/></svg>
);
const SolIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0"><title>Solana</title><path d="M4.236.427a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533V-.001a.6.6 0 00-.128-.532.6.6 0 00-.49-.28L4.236.427zm10.02 6.046a.6.6 0 00-.532.127.6.6 0 00-.28.491v4.54a.6.6 0 00.28.49.6.6 0 00.532.128l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.532V5.76a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12zm-4.383 6.64a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533v-4.54a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12z"/></svg>
);

const toDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return null;
}

const CryptoLog = ({ icon, name, address, onCopy }: { icon: React.ReactNode, name: string, address: string, onCopy: (text: string) => void }) => {
    return (
        <div className="flex items-center justify-between gap-4 text-sm font-mono">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                {icon}
                <span className="font-sans font-medium text-foreground">{name}</span>
            </div>
            <p className="overflow-hidden truncate text-muted-foreground">{address}</p>
            <button onClick={() => onCopy(address)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <ClipboardCopy className="h-4 w-4" />
            </button>
        </div>
    )
}

const SupportLinks = ({ user }: { user: UserProfile }) => {
    const { toast } = useToast();
    const { supportLinks } = user;
    const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

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
    
    const handleCopy = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        trackSupportClick(platform);
        setCopiedStates(prev => ({ ...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [platform]: true }));
        toast({ title: "Copied to clipboard!"});
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [platform]: false }));
        }, 2000);
    }
    
    const hasCrypto = supportLinks.btc || supportLinks.eth || supportLinks.sol;

    return (
        <div className="mt-8 w-full max-w-md mx-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-4">Support Me</h3>
            <div className="grid grid-cols-1 gap-3">
                {supportLinks.buyMeACoffee && (
                    <a href={supportLinks.buyMeACoffee} target="_blank" rel="noopener noreferrer" onClick={() => trackSupportClick('buyMeACoffee')} className="w-full text-center bg-yellow-400 text-black font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Coffee className="h-5 w-5" /> Buy Me a Coffee
                    </a>
                )}
                {supportLinks.email && (
                     <button onClick={() => handleCopy(supportLinks.email!, 'email')} className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        {copiedStates['email'] ? <ClipboardCheck className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        {copiedStates['email'] ? "Copied E-Transfer Email" : "E-Transfer"}
                    </button>
                )}
                {hasCrypto && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3 font-mono text-sm">
                        <p className="text-xs text-muted-foreground font-sans text-center">CRYPTO LOGS</p>
                        {supportLinks.btc && <CryptoLog icon={<Bitcoin className="h-5 w-5 shrink-0" />} name="BTC" address={supportLinks.btc} onCopy={(text) => handleCopy(text, 'btc')} />}
                        {supportLinks.eth && <CryptoLog icon={<EthIcon />} name="ETH" address={supportLinks.eth} onCopy={(text) => handleCopy(text, 'eth')} />}
                        {supportLinks.sol && <CryptoLog icon={<SolIcon />} name="SOL" address={supportLinks.sol} onCopy={(text) => handleCopy(text, 'sol')} />}
                    </div>
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
