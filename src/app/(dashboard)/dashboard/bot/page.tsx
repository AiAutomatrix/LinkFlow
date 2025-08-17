
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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";

const botSchema = z.object({
  embedScript: z.string().refine((val) => val.includes("<script"), {
    message: "Embed code must include a <script> tag.",
  }).refine((val) => val.includes("botpress.cloud") || val.includes("bpcontent.cloud"), {
    message: "Only official Botpress embed scripts are allowed.",
  }).optional().or(z.literal('')),
});

// Utility to safely inject the embed script
function injectEmbedScript(scriptString: string, containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ""; // Clear old bot if updating

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = scriptString;

    const scripts = Array.from(tempDiv.querySelectorAll("script"));
    
    scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        // Copy all attributes
        for (let i = 0; i < oldScript.attributes.length; i++) {
            const attr = oldScript.attributes[i];
            newScript.setAttribute(attr.name, attr.value);
        }
        if (oldScript.src) {
            newScript.src = oldScript.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        container.appendChild(newScript);
    });
}


export default function BotPage() {
  const { toast } = useToast();
  const { user, loading: authLoading, setUser } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  
  const form = useForm<z.infer<typeof botSchema>>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      embedScript: "",
    },
  });

  const embedScriptValue = form.watch("embedScript");

  useEffect(() => {
    if (user?.bot?.embedScript) {
      form.reset({
        embedScript: user.bot.embedScript,
      });
      injectEmbedScript(user.bot.embedScript, 'bot-embed-container');
    }
  }, [user, form]);
  
  async function onSubmit(values: z.infer<typeof botSchema>) {
    if (!user) return;
    setFormLoading(true);
    try {
        const userRef = doc(db, "users", user.uid);
        const botData = { bot: { embedScript: values.embedScript || "" } };
        await updateDoc(userRef, botData);
        setUser((prevUser) => prevUser ? { ...prevUser, ...botData } : null);
        toast({ title: "Bot embed script updated successfully!" });
        if(values.embedScript) {
            injectEmbedScript(values.embedScript, 'bot-embed-container');
        } else {
             const container = document.getElementById('bot-embed-container');
             if(container) container.innerHTML = "";
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setFormLoading(false);
    }
  }

  if (authLoading) {
      return <Loading />;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
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
            <Card>
                <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                     <CardDescription>
                        This is how your chatbot will appear to visitors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div id="bot-embed-container" className="relative w-full h-[400px] bg-muted rounded-md flex items-center justify-center">
                        {(!embedScriptValue || embedScriptValue.trim() === '') && (
                             <div className="text-center text-muted-foreground">
                                <p>Your chatbot will appear here.</p>
                                <p className="text-sm">Save an embed script to see it.</p>
                             </div>
                        )}
                     </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
