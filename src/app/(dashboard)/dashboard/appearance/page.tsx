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
import { Label } from "@/components/ui/label";
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
import { useEffect, useState, useCallback } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";
import { Loader2 } from "lucide-react";
import PublicProfilePreview from "./_components/public-profile-preview";

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
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [initialUsername, setInitialUsername] = useState("");

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
      setInitialUsername(user.username);
    }
  }, [user, form]);

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
        batch.update(userDocRef, {
            displayName: values.displayName,
            bio: values.bio,
            username: values.username,
        });

        if (values.username !== initialUsername) {
            const newUsernameDocRef = doc(firestore, "usernames", values.username);
            batch.set(newUsernameDocRef, { uid: user.uid });

            if (initialUsername) {
              const oldUsernameDocRef = doc(firestore, "usernames", initialUsername);
              batch.delete(oldUsernameDocRef);
            }
        }

        await batch.commit();
        
        // Update user context
        const updatedUser = { ...user, ...values };
        setUser(updatedUser);
        setInitialUsername(values.username);

        toast({ title: "Profile updated successfully!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Failed to update profile."});
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      {usernameStatus === 'available' && <p className="text-sm text-success">Username is available!</p>}
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

            <Button type="submit" disabled={loading || usernameStatus === 'taken'}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
            </Button>
          </form>
        </Form>
      </div>
      <div className="md:col-span-1">
        <PublicProfilePreview user={watchedValues} photoURL={user?.photoURL} />
      </div>
    </div>
  );
}
