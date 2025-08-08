"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Link, UserProfile } from "@/lib/types";

type PreviewProps = {
  profile: Partial<UserProfile> & { photoURL?: string };
  links?: Link[];
};

export default function PublicProfilePreview({ profile, links = [] }: PreviewProps) {
    const getInitials = (name: string = "") => {
        return name.split(" ").map((n) => n[0]).join("");
    };

  return (
    <Card className="sticky top-20">
      <CardContent className="p-4">
        <div className="h-[500px] w-full rounded-md border bg-background p-4 flex flex-col items-center">
            <Avatar className="h-24 w-24 mt-8">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold mt-4">{profile.displayName || "Your Name"}</h1>
            <p className="text-muted-foreground text-sm">@{profile.username || "username"}</p>
            <p className="text-center mt-2 text-sm">{profile.bio || "Your bio will appear here."}</p>
            <div className="mt-8 space-y-4 w-full">
                {links.length > 0 ? (
                  links.slice(0, 3).map((link) => (
                    <Button key={link.id} variant="secondary" className="w-full">
                      {link.title}
                    </Button>
                  ))
                ) : (
                  <>
                    <Button className="w-full">Example Link 1</Button>
                    <Button className="w-full">Example Link 2</Button>
                    <Button variant="secondary" className="w-full">Example Link 3</Button>
                  </>
                )}
                {links.length > 3 && <p className="text-center text-sm text-muted-foreground">...</p>}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
