
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";
import type { Link, UserProfile } from "@/lib/types";
import PublicProfilePreview from "@/app/(dashboard)/dashboard/appearance/_components/public-profile-preview";
import { Switch } from "@/components/ui/switch";

const botSchema = z.object({
  embedScript: z.string().refine((val) => val.trim() === '' || (val.includes("<script") && (val.includes("botpress.cloud") || val.includes("bpcdn.cloud") || val.includes("bpcontent.cloud"))), {
    message: "Embed code must be a valid Botpress script or be empty.",
  }).optional(),
  autoOpen: z.boolean().optional(),
});


export default function BotPage() {
  const { toast } = useToast();
  const { user, loading: authLoading, setUser } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  
  const form = useForm<z.infer<typeof botSchema>>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      embedScript: "",
      autoOpen: false,
    },
  });
  
  const watchedValues = form.watch();

  const previewProfile: Partial<UserProfile> = {
    ...user,
    bot: {
      embedScript: watchedValues.embedScript || '',
      autoOpen: watchedValues.autoOpen,
    },
  };

  useEffect(() => {
    if (user) {
        form.reset({
            embedScript: user.bot?.embedScript || '',
            autoOpen: user.bot?.autoOpen || false
        });
    }
  }, [user, form]);
  
  useEffect(() => {
    if (!user) return;
    const linksCollection = collection(db, `users/${user.uid}/links`);
    const q = query(linksCollection, orderBy("order"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setLinks(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Link)))
    });
    return () => unsubscribe();
  }, [user]);

  async function onSubmit(values: z.infer<typeof botSchema>) {
    if (!user) return;
    setFormLoading(true);
    try {
        const userRef = doc(db, "users", user.uid);
        const botData = { 
            bot: { 
                embedScript: values.embedScript || "",
                autoOpen: values.autoOpen || false,
            } 
        };
        await updateDoc(userRef, botData);
        setUser((prevUser) => prevUser ? { ...prevUser, ...botData } : null);
        toast({ title: "Bot settings updated successfully!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setFormLoading(false);
    }
  }

  if (authLoading || !user) {
      return <Loading />;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1 space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Chatbot Integration</h1>
            <p className="text-muted-foreground">
                Embed a chatbot on your public profile page.
            </p>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Bot Settings</CardTitle>
                <CardDescription>
                    Paste the full embed code snippet from your bot provider (e.g., Botpress).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="autoOpen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Auto-open Webchat
                        </FormLabel>
                        <FormDescription>
                          Automatically open the webchat when a visitor lands on your profile.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!watchedValues.embedScript}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                control={form.control}
                name="embedScript"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Embed Script</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder="<script src='...'></script>"
                            className="resize-y min-h-[150px] font-mono text-xs"
                            {...field}
                        />
                    </FormControl>
                     <FormDescription>
                        Only scripts from Botpress are currently allowed. Leave blank to remove the bot.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            </Card>
            
            <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Bot Settings
            </Button>
        </form>
        </Form>
    </div>
     <div className="relative lg:col-span-1 h-[700px]">
        <PublicProfilePreview 
          profile={previewProfile} 
          links={links} 
          isPreview 
          showBot={true}
        />
      </div>
    </div>
  );
}
