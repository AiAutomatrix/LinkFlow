
"use client";

import AnimatedBackground from "@/components/animated-background";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Link as LinkType, UserProfile } from "@/lib/types";
import { Mail, Instagram, Facebook, Github, Coffee, Banknote, Bitcoin } from 'lucide-react';


type PreviewProps = {
  profile: Partial<UserProfile> & { photoURL?: string };
  links?: LinkType[];
  socialLinks?: UserProfile['socialLinks'];
};

const SupportLinks = ({ links }: { links?: UserProfile['supportLinks'] }) => {
    if (!links || Object.values(links).every(v => !v)) return null;
    
    return (
        <div className="mt-8 w-full max-w-xs mx-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-3">Support Me</h3>
            <div className="flex flex-col gap-3">
                {links.buyMeACoffee && (
                    <div className="w-full text-center bg-yellow-400 text-black font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2">
                        <Coffee className="h-5 w-5" /> Buy Me a Coffee
                    </div>
                )}
                {links.email && (
                     <div className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2">
                        <Banknote className="h-5 w-5" /> E-Transfer
                    </div>
                )}
                 {links.btc && (
                     <div className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2">
                        <Bitcoin className="h-5 w-5" /> Bitcoin
                    </div>
                )}
            </div>
        </div>
    );
};


export default function PublicProfilePreview({ profile, links = [], socialLinks: propSocialLinks }: PreviewProps) {
    const getInitials = (name: string = "") => {
        return name.split(" ").map((n) => n[0]).join("");
    };

    const socialLinks = links.filter(l => l.isSocial && l.active);
    const regularLinks = links.filter(l => !l.isSocial && l.active);

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
    <Card className="md:sticky top-20">
      <CardContent className="p-4">
        <div 
          data-theme={profile.theme || 'light'}
          className="h-[600px] w-full rounded-md border bg-background p-4 flex flex-col items-center relative overflow-hidden"
        >
            {profile.animatedBackground && <AnimatedBackground />}
            <div className="flex-1 w-full flex flex-col items-center pt-8 text-center z-10 overflow-y-auto">
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

              <SupportLinks links={profile.supportLinks} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
