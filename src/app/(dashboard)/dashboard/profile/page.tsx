
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(50),
  username: z
    .string()
    .min(3, "Username must be 3-20 characters.")
    .max(20)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores."
    ),
  bio: z.string().max(160, "Bio cannot exceed 160 characters.").optional(),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, loading: authLoading, setUser, uploadProfilePicture } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState("");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
    },
  });

  useEffect(() => {
      if (user) {
          form.reset({
              displayName: user.displayName,
              username: user.username,
              bio: user.bio,
          });
          setPhotoURL(user.photoURL || "");
      }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setFormLoading(true);
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, values);
        setUser((prevUser) => prevUser ? { ...prevUser, ...values } : null);
        toast({ title: "Profile updated successfully!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setFormLoading(false);
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    const file = event.target.files[0];
    setUploading(true);
    
    try {
        const newPhotoURL = await uploadProfilePicture(user.uid, file);
        setPhotoURL(newPhotoURL);
        toast({ title: "Profile picture updated!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Upload failed", description: error.message });
    } finally {
        setUploading(false);
    }
  };

  const getInitials = (name: string = "") => {
    return name.split(" ").map((n) => n[0]).join("");
  };

  if (authLoading) {
      return <Loading />;
  }
  
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>
                        Click on the avatar to upload a new photo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-24 h-24 group cursor-pointer" onClick={handleAvatarClick}>
                        {uploading ? (
                            <div className="w-full h-full flex items-center justify-center rounded-full bg-muted">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={photoURL || undefined} />
                                    <AvatarFallback>{getInitials(form.getValues("displayName"))}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" />
                                </div>
                            </>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif"
                    />
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your username and personal details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <Input placeholder="your_unique_name" {...field} />
                      <FormDescription>
                        This will be your public URL: linkflow.com/u/{form.getValues("username")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little bit about yourself"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Button type="submit" disabled={formLoading || uploading}>
                {(formLoading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
            </Button>
          </form>
        </Form>
    </div>
  );
}
