"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PreviewProps = {
  user: {
    displayName?: string;
    username?: string;
    bio?: string;
  };
  photoURL?: string;
};

export default function PublicProfilePreview({ user, photoURL }: PreviewProps) {
  const getInitials = (name: string = "") => {
    return name.split(" ").map((n) => n[0]).join("");
  };

  return (
    <Card className="sticky top-20">
      <CardContent className="p-4">
        <div className="h-[500px] w-full rounded-md border bg-background p-4 flex flex-col items-center">
            <Avatar className="h-24 w-24 mt-8">
              <AvatarImage src={photoURL} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold mt-4">{user.displayName || "Your Name"}</h1>
            <p className="text-muted-foreground text-sm">@{user.username || "username"}</p>
            <p className="text-center mt-2 text-sm">{user.bio || "Your bio will appear here."}</p>
            <div className="mt-8 space-y-4 w-full">
                <Button className="w-full">Example Link 1</Button>
                <Button className="w-full">Example Link 2</Button>
                <Button variant="secondary" className="w-full">Example Link 3</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
