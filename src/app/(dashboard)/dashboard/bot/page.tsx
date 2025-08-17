
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
import PublicProfilePreview from "../appearance/_components/public-profile-preview";
import type { Link, UserProfile } from "@/lib/types";

const botSchema = z.object({
  embedScript: z.string().refine((val) => val.trim() === '' || (val.includes("<script") && (val.includes("botpress.cloud") || val.includes("bpcdn.cloud"))), {
    message: "Embed code must be a valid Botpress script or be empty.",
  }).optional(),
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
    },
  });
  
  const watchedEmbedScript = form.watch("embedScript");
  
  const previewProfile: Partial<UserProfile> = {
    ...user,
    bot: { embedScript: watchedEmbedScript || "" },
  };


  useEffect(() => {
    if (user) {
        form.reset({
            embedScript: user.bot?.embedScript || ''
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
        const botData = { bot: { embedScript: values.embedScript || "" } };
        await updateDoc(userRef, botData);
        setUser((prevUser) => prevUser ? { ...prevUser, ...botData } : null);
        toast({ title: "Bot embed script updated successfully!" });
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
                <CardTitle>Bot Embed Code</CardTitle>
                <CardDescription>
                    Paste the full embed code snippet from your bot provider (e.g., Botpress).
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                Save Bot Embed
            </Button>
        </form>
        </Form>
    </div>
     <div className="lg:col-span-1">
        <PublicProfilePreview profile={previewProfile} links={links} isPreview />
      </div>
    </div>
  );
}
