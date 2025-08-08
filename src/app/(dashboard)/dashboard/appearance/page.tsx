
"use client";

import { useAuth } from "@/contexts/auth-context";
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
import { useEffect, useState, useCallback, useRef } from "react";
import { firestore, storage } from "@/lib/firebase";
import { doc, getDoc, writeBatch, collection, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";
import PublicProfilePreview from "./_components/public-profile-preview";
import type { Link, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

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

export default function AppearancePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [initialUsername, setInitialUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
    },
  });
  
  const watchedValues = form.watch();

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
      });
      setInitialUsername(user.username || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user, form.reset]);

  useEffect(() => {
    if (!user) return;

    const linksCollection = collection(firestore, "users", user.uid, "links");
    const q = query(linksCollection, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const linksData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Link)
      );
      setLinks(linksData);
    });

    return () => unsubscribe();
  }, [user]);

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username === initialUsername) {
        setUsernameStatus("idle");
        return;
      }
      if (username.length < 3) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("checking");
      const usernameDocRef = doc(firestore, "usernames", username);
      const docSnap = await getDoc(usernameDocRef);
      setUsernameStatus(docSnap.exists() ? "taken" : "available");
    }, 500),
    [initialUsername]
  );

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "username" && value.username) {
        checkUsername(value.username);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkUsername]);
  

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    if (usernameStatus === 'taken') {
        toast({ variant: 'destructive', title: 'Username is already taken.' });
        return;
    }
    setLoading(true);

    try {
        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, "users", user.uid);
        
        const profileData: Partial<UserProfile> = {
            displayName: values.displayName,
            bio: values.bio,
            username: values.username,
        }
        batch.update(userDocRef, profileData);

        if (values.username !== initialUsername) {
            const newUsernameDocRef = doc(firestore, "usernames", values.username);
            batch.set(newUsernameDocRef, { uid: user.uid });

            if (initialUsername) {
              const oldUsernameDocRef = doc(firestore, "usernames", initialUsername);
              batch.delete(oldUsernameDocRef);
            }
        }

        await batch.commit();
        
        setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null);
        setInitialUsername(values.username);

        toast({ title: "Profile updated successfully!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Failed to update profile."});
        console.error(error);
    } finally {
        setLoading(false);
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
      const storageRef = ref(storage, `profile_pictures/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const newPhotoURL = await getDownloadURL(storageRef);

      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      }
      
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { photoURL: newPhotoURL });
      
      setPhotoURL(newPhotoURL);
      setUser(prevUser => prevUser ? { ...prevUser, photoURL: newPhotoURL } : null);

      toast({ title: "Profile picture updated!" });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload your profile picture.' });
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string = "") => {
    return name.split(" ").map((n) => n[0]).join("");
  };


  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
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
                                    <AvatarImage src={photoURL} />
                                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
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
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  This is how others will see you on the site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <div className="relative">
                        <Input placeholder="your_unique_name" {...field} />
                        {usernameStatus === 'checking' && <Loader2 className="absolute right-2 top-2 h-5 w-5 animate-spin text-muted-foreground" />}
                      </div>
                      {usernameStatus === 'available' && <p className="text-sm text-green-600">Username is available!</p>}
                      {usernameStatus === 'taken' && <p className="text-sm text-destructive">Username is taken.</p>}
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

            <Button type="submit" disabled={loading || usernameStatus === 'taken' || uploading}>
                {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
            </Button>
          </form>
        </Form>
      </div>
      <div className="md:col-span-1">
        <PublicProfilePreview profile={{...watchedValues, photoURL}} links={links} />
      </div>
    </div>
  );
}
