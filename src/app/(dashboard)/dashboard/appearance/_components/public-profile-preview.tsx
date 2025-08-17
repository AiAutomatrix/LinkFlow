
"use client";

import AnimatedBackground from "@/components/animated-background";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { UserProfile, Link as LinkType } from "@/lib/types";
import { Mail, Instagram, Facebook, Github, Coffee, Banknote, Bitcoin, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";


const EthIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0"><title>Ethereum</title><path d="M11.944 17.97L4.58 13.62 11.943 24l7.365-10.38-7.364 4.35zM12.056 0L4.69 12.223l7.366-4.354 7.365 4.354L12.056 0z"/></svg>
);
const SolIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0"><title>Solana</title><path d="M4.236.427a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533V-.001a.6.6 0 00-.128-.532.6.6 0 00-.49-.28L4.236.427zm10.02 6.046a.6.6 0 00-.532.127a.6.6 0 00-.28.491v4.54a.6.6 0 00.28.49.6.6 0 00.532.128l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.532V5.76a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12zm-4.383 6.64a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533v-4.54a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12z"/></svg>
);


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

const SupportLinks = ({ links }: { links: LinkType[] }) => {
    const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

    const buyMeACoffeeLink = links.find(l => l.title === 'Buy Me A Coffee');
    const eTransferLink = links.find(l => l.title === 'E-Transfer');
    const btcLink = links.find(l => l.title === 'BTC');
    const ethLink = links.find(l => l.title === 'ETH');
    const solLink = links.find(l => l.title === 'SOL');

    const hasCrypto = btcLink || ethLink || solLink;

    if (!buyMeACoffeeLink && !eTransferLink && !hasCrypto) {
        return null;
    }


    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    }

    return (
        <div className="mt-8 w-full max-w-md mx-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-4">Support Me</h3>
            <div className="grid grid-cols-1 gap-3">
                {buyMeACoffeeLink && (
                    <div className="w-full text-center bg-yellow-400 text-black font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                        <Coffee className="h-5 w-5" /> Buy Me a Coffee
                    </div>
                )}
                {eTransferLink && (
                     <div 
                        onClick={() => handleCopy(eTransferLink.url.replace('mailto:', ''), eTransferLink.id)}
                        className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer"
                    >
                        {copiedStates[eTransferLink.id] ? <ClipboardCheck className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        {copiedStates[eTransferLink.id] ? "Copied E-Transfer Email" : "E-Transfer"}
                    </div>
                )}
                {hasCrypto && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3 font-mono text-sm">
                        <p className="text-xs text-muted-foreground font-sans text-center">CRYPTO LOGS</p>
                        {btcLink && <CryptoLog icon={<Bitcoin className="h-5 w-5 shrink-0" />} name="BTC" address={btcLink.url} onCopy={(text) => handleCopy(text, btcLink.id)} />}
                        {ethLink && <CryptoLog icon={<EthIcon />} name="ETH" address={ethLink.url} onCopy={(text) => handleCopy(text, ethLink.id)} />}
                        {solLink && <CryptoLog icon={<SolIcon />} name="SOL" address={solLink.url} onCopy={(text) => handleCopy(text, solLink.id)} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function PublicProfilePreview({ profile, links = [], isPreview = false, embedScript }: { profile: Partial<UserProfile>; links?: LinkType[], isPreview?: boolean, embedScript?: string }) {

    const getInitials = (name: string = "") => {
        return name.split(" ").map((n) => n[0]).join("");
    };

    const socialLinks = links.filter(l => l.isSocial && l.active);
    const regularLinks = links.filter(l => !l.isSocial && !l.isSupport && l.active);
    const supportLinks = links.filter(l => l.isSupport && l.active);


    const SocialIcon = ({ platform }: { platform: string }) => {
        switch (platform.toLowerCase()) {
            case 'email': return <Mail className="h-6 w-6" />;
            case 'instagram': return <Instagram className="h-6 w-6" />;
            case 'facebook': return <Facebook className="h-6 w-6" />;
            case 'github': return <Github className="h-6 w-6" />;
            default: return null;
        }
    };

    const LinkButton = ({ children }: { children: React.ReactNode }) => (
      <div
        className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-[0.98] cursor-pointer"
      >
        {children}
      </div>
    );


  return (
    <Card className={cn(isPreview ? "border-none shadow-none" : "")}>
      <CardContent className={cn(isPreview ? "p-0" : "p-4")}>
        <div 
          data-theme={profile.theme || 'light'}
          className="h-[700px] w-full rounded-md border bg-background flex flex-col items-center relative overflow-hidden"
        >
            {profile.animatedBackground && <AnimatedBackground />}
            <div className="flex-1 w-full flex flex-col items-center pt-8 text-center z-10 overflow-y-auto p-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold mt-4 text-foreground">{profile.displayName || "Your Name"}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username || "username"}</p>
              <p className="text-center mt-2 text-sm text-foreground/80">{profile.bio || "Your bio will appear here."}</p>
              
              <div className="flex gap-4 justify-center mt-4 text-foreground/80">
                {socialLinks.map(link => (
                    <SocialIcon key={link.id} platform={link.title} />
                ))}
              </div>
              
              <div className="mt-8 space-y-4 w-full max-w-xs mx-auto">
                  {regularLinks.length > 0 ? (
                    regularLinks.slice(0, 2).map((link) => (
                      <LinkButton key={link.id}>
                        {link.title}
                      </LinkButton>
                    ))
                  ) : (
                    <>
                      <LinkButton>Example Link 1</LinkButton>
                      <LinkButton>Example Link 2</LinkButton>
                    </>
                  )}
                  {regularLinks.length > 2 && <p className="text-center text-sm text-muted-foreground">...</p>}
              </div>

              <SupportLinks links={supportLinks} />
            </div>
            {embedScript && (
                 <iframe
                    srcDoc={embedScript}
                    className="absolute inset-0 w-full h-full border-0 z-20"
                    title="Bot Preview"
                />
            )}
        </div>
      </CardContent>
    </Card>
  );
}
