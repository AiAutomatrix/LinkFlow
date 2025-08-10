
"use client";

import AnimatedBackground from "@/components/animated-background";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Link as LinkType, UserProfile } from "@/lib/types";
import { Mail, Instagram, Facebook, Github } from 'lucide-react';


type PreviewProps = {
  profile: Partial<UserProfile> & { photoURL?: string };
  links?: LinkType[];
  socialLinks?: UserProfile['socialLinks']
};

export default function PublicProfilePreview({ profile, links = [], socialLinks }: PreviewProps) {
    const getInitials = (name: string = "") => {
        return name.split(" ").map((n) => n[0]).join("");
    };

    const currentSocialLinks = socialLinks || profile.socialLinks || {};

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
          className="h-[500px] w-full rounded-md border bg-background p-4 flex flex-col items-center relative overflow-hidden"
        >
            {profile.animatedBackground && <AnimatedBackground />}
            <div className="flex-1 w-full flex flex-col items-center pt-8 text-center z-10">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold mt-4 text-foreground">{profile.displayName || "Your Name"}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username || "username"}</p>
              <p className="text-center mt-2 text-sm text-foreground/80">{profile.bio || "Your bio will appear here."}</p>
              
              <div className="flex gap-4 justify-center mt-4 text-foreground/80">
                {currentSocialLinks.email && <Mail className="h-6 w-6" />}
                {currentSocialLinks.instagram && <Instagram className="h-6 w-6" />}
                {currentSocialLinks.facebook && <Facebook className="h-6 w-6" />}
                {currentSocialLinks.github && <Github className="h-6 w-6" />}
              </div>
              
              <div className="mt-8 space-y-4 w-full max-w-xs mx-auto">
                  {links.filter(l => l.active && !l.isSocial).length > 0 ? (
                    links.filter(l => l.active && !l.isSocial).slice(0, 3).map((link) => (
                      <LinkButton key={link.id}>
                        {link.title}
                      </LinkButton>
                    ))
                  ) : (
                    <>
                      <LinkButton>Example Link 1</LinkButton>
                      <LinkButton>Example Link 2</LinkButton>
                      <LinkButton>Example Link 3</LinkButton>
                    </>
                  )}
                  {links.filter(l => l.active && !l.isSocial).length > 3 && <p className="text-center text-sm text-muted-foreground">...</p>}
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
