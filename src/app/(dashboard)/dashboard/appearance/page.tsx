
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import PublicProfilePreview from "./_components/public-profile-preview";
import type { Link, UserProfile } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";

const appearanceSchema = z.object({
  theme: z.string().optional(),
  animatedBackground: z.boolean().optional(),
});

export const themes = [
    { id: 'light', name: 'Light', colors: ['#FFFFFF', '#E2E8F0'], cssVars: { background: '220 40% 98%', foreground: '220 15% 20%', primary: '220 90% 60%', primaryForeground: '220 15% 20%', secondary: '220 15% 90%', secondaryForeground: '220 15% 20%' } },
    { id: 'dark', name: 'Dark', colors: ['#1A202C', '#4A5568'], cssVars: { background: '220 20% 10%', foreground: '220 20% 95%', primary: '210 90% 65%', primaryForeground: '220 20% 95%', secondary: '220 20% 20%', secondaryForeground: '220 20% 95%' } },
    { id: 'neon-green', name: 'Neon Green', colors: ['#0F172A', '#34D399'], cssVars: { background: '300 5% 8%', foreground: '120 100% 80%', primary: '120 100% 50%', primaryForeground: '120 100% 80%', secondary: '120 95% 15%', secondaryForeground: '120 100% 80%' } },
    { id: 'neon-pink', name: 'Neon Pink', colors: ['#1E1B4B', '#F472B6'], cssVars: { background: '300 10% 10%', foreground: '320 100% 85%', primary: '320 100% 60%', primaryForeground: '320 100% 85%', secondary: '320 100% 18%', secondaryForeground: '320 100% 85%' } },
    { id: 'gradient-sunset', name: 'Sunset', colors: ['#FECACA', '#F9A8D4'], cssVars: { background: '20 100% 98%', foreground: '20 80% 20%', primary: '340 90% 60%', primaryForeground: '20 80% 20%', secondary: '20 90% 92%', secondaryForeground: '20 80% 20%' } },
    { id: 'ocean-blue', name: 'Ocean Blue', colors: ['#E0F2FE', '#38BDF8'], cssVars: { background: '210 100% 98%', foreground: '215 80% 25%', primary: '210 90% 55%', primaryForeground: '215 80% 25%', secondary: '210 95% 90%', secondaryForeground: '215 80% 25%' } },
    { id: 'forest-green', name: 'Forest Green', colors: ['#F0FDF4', '#4ADE80'], cssVars: { background: '120 20% 98%', foreground: '120 60% 20%', primary: '120 50% 40%', primaryForeground: '120 60% 20%', secondary: '120 40% 90%', secondaryForeground: '120 60% 20%' } },
    { id: 'royal-purple', name: 'Royal Purple', colors: ['#F5F3FF', '#A78BFA'], cssVars: { background: '270 50% 98%', foreground: '270 50% 20%', primary: '270 60% 60%', primaryForeground: '270 50% 20%', secondary: '270 50% 92%', secondaryForeground: '270 50% 20%' } },
    { id: 'crimson-red', name: 'Crimson Red', colors: ['#FEF2F2', '#F87171'], cssVars: { background: '0 50% 98%', foreground: '0 60% 25%', primary: '0 70% 55%', primaryForeground: '0 60% 25%', secondary: '0 60% 94%', secondaryForeground: '0 60% 25%' } },
    { id: 'goldenrod', name: 'Goldenrod', colors: ['#FEFCE8', '#FACC15'], cssVars: { background: '45 100% 97%', foreground: '40 80% 20%', primary: '45 100% 50%', primaryForeground: '40 80% 10%', secondary: '45 90% 90%', secondaryForeground: '40 80% 20%' } },
    { id: 'minty-fresh', name: 'Minty Fresh', colors: ['#F0FDF4', '#6EE7B7'], cssVars: { background: '150 70% 97%', foreground: '150 50% 25%', primary: '150 55% 50%', primaryForeground: '150 50% 25%', secondary: '150 60% 92%', secondaryForeground: '150 50% 25%' } },
    { id: 'charcoal', name: 'Charcoal', colors: ['#334155', '#94A3B8'], cssVars: { background: '220 10% 20%', foreground: '220 10% 90%', primary: '220 15% 70%', primaryForeground: '220 10% 90%', secondary: '220 10% 30%', secondaryForeground: '220 10% 90%' } },
    { id: 'lavender', name: 'Lavender', colors: ['#F5F3FF', '#C4B5FD'], cssVars: { background: '250 80% 98%', foreground: '250 40% 30%', primary: '250 60% 70%', primaryForeground: '250 40% 30%', secondary: '250 70% 95%', secondaryForeground: '250 40% 30%' } },
    { id: 'mocha', name: 'Mocha', colors: ['#FDF4E6', '#D4A574'], cssVars: { background: '30 25% 95%', foreground: '30 40% 20%', primary: '30 40% 50%', primaryForeground: '30 40% 20%', secondary: '30 30% 90%', secondaryForeground: '30 40% 20%' } },
    { id: 'teal', name: 'Teal', colors: ['#F0FDFA', '#2DD4BF'], cssVars: { background: '180 50% 96%', foreground: '180 70% 20%', primary: '180 60% 40%', primaryForeground: '180 70% 20%', secondary: '180 50% 90%', secondaryForeground: '180 70% 20%' } },
    { id: 'coral', name: 'Coral', colors: ['#FFF1F2', '#FB7185'], cssVars: { background: '10 100% 97%', foreground: '10 80% 30%', primary: '10 90% 65%', primaryForeground: '10 80% 30%', secondary: '10 90% 94%', secondaryForeground: '10 80% 30%' } },
    { id: 'indigo', name: 'Indigo', colors: ['#283593', '#818CF8'], cssVars: { background: '240 60% 15%', foreground: '240 50% 90%', primary: '240 70% 75%', primaryForeground: '240 50% 90%', secondary: '240 50% 30%', secondaryForeground: '240 50% 90%' } },
    { id: 'olive', name: 'Olive', colors: ['#F4FCE8', '#A3CC4A'], cssVars: { background: '80 20% 96%', foreground: '80 40% 20%', primary: '80 30% 45%', primaryForeground: '80 40% 20%', secondary: '80 25% 90%', secondaryForeground: '80 40% 20%' } },
    { id: 'rose-gold', name: 'Rose Gold', colors: ['#FFF1F2', '#F4C4C4'], cssVars: { background: '25 80% 96%', foreground: '25 50% 30%', primary: '350 70% 75%', primaryForeground: '25 50% 15%', secondary: '25 70% 92%', secondaryForeground: '25 50% 30%' } },
    { id: 'slate', name: 'Slate', colors: ['#475569', '#E2E8F0'], cssVars: { background: '220 30% 25%', foreground: '220 20% 95%', primary: '210 40% 75%', primaryForeground: '220 20% 95%', secondary: '220 30% 40%', secondaryForeground: '220 20% 95%' } },
  ];

export default function AppearancePage() {
  const { toast } = useToast();
  const { user, loading: authLoading, setUser } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);

  const form = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "light",
      animatedBackground: false,
    },
  });
  
  const watchedValues = form.watch();

  const previewProfile: Partial<UserProfile> & { photoURL?: string } = {
    ...user,
    ...watchedValues,
  };

  useEffect(() => {
      if (user) {
          form.reset({
              theme: user.theme || 'light',
              animatedBackground: user.animatedBackground || false,
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

  async function onSubmit(values: z.infer<typeof appearanceSchema>) {
    if (!user) return;
    setFormLoading(true);
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, values);
        setUser((prevUser) => prevUser ? { ...prevUser, ...values } : null);
        toast({ title: "Appearance updated successfully!" });
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Select a theme and customize the look of your profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                       <Carousel
                        opts={{
                          align: "start",
                          slidesToScroll: "auto",
                        }}
                        className="w-full"
                      >
                        <CarouselContent>
                          {themes.map((theme) => (
                            <CarouselItem key={theme.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/4">
                              <div className="p-1">
                                  <div 
                                      className={cn(
                                          "w-full aspect-square rounded-lg flex items-center justify-center border-2 cursor-pointer",
                                          field.value === theme.id ? 'border-primary' : 'border-transparent'
                                      )}
                                      onClick={() => field.onChange(theme.id)}
                                  >
                                      <div className="w-10 h-10 rounded-full flex overflow-hidden" style={{ background: `linear-gradient(45deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)` }}></div>
                                  </div>
                                  <p className="text-sm text-center mt-2">{theme.name}</p>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="animatedBackground"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Animated Background
                        </FormLabel>
                        <FormDescription>
                          Enable a subtle, animated background on your public profile.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Appearance
            </Button>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-1">
        <PublicProfilePreview 
            profile={previewProfile} 
            links={links} 
            isPreview 
            embedScript={user?.bot?.embedScript}
        />
      </div>
    </div>
  );
}

    