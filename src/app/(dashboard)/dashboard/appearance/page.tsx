
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
import { Loader2, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const appearanceSchema = z.object({
  theme: z.string().optional(),
  animatedBackground: z.boolean().optional(),
  buttonStyle: z.enum(['solid', 'gradient']).optional(),
});

export const themes = [
    { id: 'light', name: 'Light', colors: ['#FFFFFF', '#E2E8F0'], cssVars: {} },
    { id: 'dark', name: 'Dark', colors: ['#1A202C', '#4A5568'], cssVars: {} },
    { id: 'neon-green', name: 'Neon Green', colors: ['#0F172A', '#34D399'], cssVars: {} },
    { id: 'neon-pink', name: 'Neon Pink', colors: ['#1E1B4B', '#F472B6'], cssVars: {} },
    { id: 'gradient-sunset', name: 'Sunset', colors: ['#FECACA', '#F9A8D4'], cssVars: {} },
    { id: 'ocean-blue', name: 'Ocean Blue', colors: ['#E0F2FE', '#38BDF8'], cssVars: {} },
    { id: 'forest-green', name: 'Forest Green', colors: ['#F0FDF4', '#4ADE80'], cssVars: {} },
    { id: 'royal-purple', name: 'Royal Purple', colors: ['#F5F3FF', '#A78BFA'], cssVars: {} },
    { id: 'crimson-red', name: 'Crimson Red', colors: ['#FEF2F2', '#F87171'], cssVars: {} },
    { id: 'goldenrod', name: 'Goldenrod', colors: ['#FEFCE8', '#FACC15'], cssVars: {} },
    { id: 'minty-fresh', name: 'Minty Fresh', colors: ['#F0FDF4', '#6EE7B7'], cssVars: {} },
    { id: 'charcoal', name: 'Charcoal', colors: ['#334155', '#94A3B8'], cssVars: {} },
    { id: 'lavender', name: 'Lavender', colors: ['#F5F3FF', '#C4B5FD'], cssVars: {} },
    { id: 'mocha', name: 'Mocha', colors: ['#FDF4E6', '#D4A574'], cssVars: {} },
    { id: 'teal', name: 'Teal', colors: ['#F0FDFA', '#2DD4BF'], cssVars: {} },
    { id: 'coral', name: 'Coral', colors: ['#FFF1F2', '#FB7185'], cssVars: {} },
    { id: 'indigo', name: 'Indigo', colors: ['#283593', '#818CF8'], cssVars: {} },
    { id: 'olive', name: 'Olive', colors: ['#F4FCE8', '#A3CC4A'], cssVars: {} },
    { id: 'rose-gold', name: 'Rose Gold', colors: ['#FFF1F2', '#F4C4C4'], cssVars: {} },
    { id: 'slate', name: 'Slate', colors: ['#475569', '#E2E8F0'], cssVars: {} },
    { id: 'sky-blue', name: 'Sky Blue', colors: ['#EFF6FF', '#60A5FA'], cssVars: {} },
    { id: 'candy-floss', name: 'Candy Floss', colors: ['#FCE7F3', '#F9A8D4'], cssVars: {} },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0d0221', '#00f6ff'], cssVars: {} },
    { id: 'vintage-paper', name: 'Vintage Paper', colors: ['#FDFBF6', '#D4CFCB'], cssVars: {} },
    { id: 'gothic', name: 'Gothic', colors: ['#171717', '#737373'], cssVars: {} },
    { id: 'beach-vibes', name: 'Beach Vibes', colors: ['#FFFBEB', '#F59E0B'], cssVars: {} },
    { id: 'earthy-tones', name: 'Earthy Tones', colors: ['#FEFCE8', '#854d0e'], cssVars: {} },
    { id: 'monochrome-cool', name: 'Monochrome Cool', colors: ['#F3F4F6', '#4B5563'], cssVars: {} },
    { id: 'sunrise-orange', name: 'Sunrise Orange', colors: ['#FFF7ED', '#FB923C'], cssVars: {} },
    { id: 'deep-space', name: 'Deep Space', colors: ['#030712', '#3B82F6'], cssVars: {} },
    { id: 'bubblegum', name: 'Bubblegum', colors: ['#FDF2F8', '#EC4899'], cssVars: {} },
    { id: 'sandstone', name: 'Sandstone', colors: ['#FDF6E3', '#B8860B'], cssVars: {} },
    { id: 'velvet', name: 'Velvet', colors: ['#1E1B26', '#9D4EDD'], cssVars: {} },
    { id: 'jungle', name: 'Jungle', colors: ['#F0FFF4', '#10B981'], cssVars: {} },
    { id: 'retro-wave', name: 'Retro Wave', colors: ['#2A0944', '#F86CF5'], cssVars: {} },
    { id: 'amethyst', name: 'Amethyst', colors: ['#241933', '#e0c3fc'], cssVars: {} },
    { id: 'cherry-blossom', name: 'Cherry Blossom', colors: ['#fdebf3', '#fbb1d3'], cssVars: {} },
    { id: 'seafoam', name: 'Seafoam', colors: ['#e6fcf5', '#96f2d7'], cssVars: {} },
    { id: 'copper', name: 'Copper', colors: ['#4a2c2a', '#da8a67'], cssVars: {} },
    { id: 'nordic-blue', name: 'Nordic Blue', colors: ['#2e3440', '#88c0d0'], cssVars: {} },
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
      buttonStyle: 'solid',
    },
  });
  
  const watchedValues = form.watch();

  const previewProfile: Partial<UserProfile> & { photoURL?: string } = {
    ...user,
    ...watchedValues,
    bot: user?.bot, // Ensure bot data is passed to the preview
  };

  useEffect(() => {
      if (user) {
          form.reset({
              theme: user.theme || 'light',
              animatedBackground: user.animatedBackground || false,
              buttonStyle: user.buttonStyle || 'solid',
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
      <div className="lg:sticky lg:top-6 space-y-6">
        <div className="relative h-[700px] w-full max-w-sm mx-auto">
            <PublicProfilePreview 
                profile={previewProfile} 
                links={links} 
                isPreview 
                showBot={true}
            />
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Appearance</h1>
            <p className="text-muted-foreground">
              Customize the look and feel of your public profile.
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Select a color scheme for your profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                       <Carousel
                        opts={{
                          align: "start",
                          slidesToScroll: "auto",
                        }}
                        className="w-full"
                      >
                        <CarouselContent>
                          {themes.map((theme) => (
                            <CarouselItem key={theme.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5">
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

            <Card>
                <CardHeader>
                    <CardTitle>Button Style</CardTitle>
                    <CardDescription>Choose the appearance of your profile links.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                      control={form.control}
                      name="buttonStyle"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="solid" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Solid
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="gradient" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Gradient
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Custom Gradients</CardTitle>
                        <CardDescription>Create your own unique gradients.</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" disabled>
                        <Star className="mr-2 h-4 w-4" />
                        Upgrade
                    </Button>
                </CardHeader>
                <CardContent className="opacity-50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Theme Gradient</p>
                            <div className="h-8 w-24 rounded-md bg-gradient-to-r from-muted to-muted/50" />
                        </div>
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Button Gradient</p>
                            <div className="h-8 w-24 rounded-md bg-gradient-to-r from-muted to-muted/50" />
                        </div>
                    </div>
                </CardContent>
            </Card>


            <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Appearance
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

    