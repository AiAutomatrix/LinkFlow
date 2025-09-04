
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
import { useEffect, useState, useReducer, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import PublicProfilePreview from "./_components/public-profile-preview";
import type { Link, UserProfile } from "@/lib/types";
import { Loader2, RefreshCw, Palette, Square, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";

const hexColor = () => z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color");

const appearanceSchema = z.object({
  theme: z.string().optional(),
  animatedBackground: z.boolean().optional(),
  buttonStyle: z.enum(['solid', 'gradient']).optional(),
  customThemeGradient: z.object({
    from: hexColor().optional(),
    to: hexColor().optional(),
  }).optional(),
  customButtonGradient: z.object({
    from: hexColor().optional(),
    to: hexColor().optional(),
  }).optional(),
});

export const themes = [
    // Core
    { id: 'light', name: 'Light', colors: ['#FFFFFF', '#E2E8F0'] },
    { id: 'dark', name: 'Dark', colors: ['#1A202C', '#4A5568'] },
    { id: 'charcoal', name: 'Charcoal', colors: ['#334155', '#94A3B8'] },
    { id: 'slate', name: 'Slate', colors: ['#475569', '#E2E8F0'] },
    
    // Vibrant & Neon
    { id: 'neon-green', name: 'Neon Green', colors: ['#0F172A', '#34D399'] },
    { id: 'neon-pink', name: 'Neon Pink', colors: ['#1E1B4B', '#F472B6'] },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0d0221', '#00f6ff'] },
    { id: 'retro-wave', name: 'Retro Wave', colors: ['#2A0944', '#F86CF5'] },
    
    // Gradients & Soft
    { id: 'gradient-sunset', name: 'Sunset', colors: ['#FECACA', '#F9A8D4'] },
    { id: 'ocean-blue', name: 'Ocean Blue', colors: ['#E0F2FE', '#38BDF8'] },
    { id: 'lavender', name: 'Lavender', colors: ['#F5F3FF', '#C4B5FD'] },
    { id: 'cherry-blossom', name: 'Cherry Blossom', colors: ['#fdebf3', '#fbb1d3'] },
    { id: 'seafoam', name: 'Seafoam', colors: ['#e6fcf5', '#96f2d7'] },
    { id: 'candy-floss', name: 'Candy Floss', colors: ['#FCE7F3', '#F9A8D4'] },
    { id: 'sky-blue', name: 'Sky Blue', colors: ['#EFF6FF', '#60A5FA'] },
    
    // Elegant & Rich
    { id: 'amethyst', name: 'Amethyst', colors: ['#241933', '#e0c3fc'] },
    { id: 'royal-purple', name: 'Royal Purple', colors: ['#F5F3FF', '#A78BFA'] },
    { id: 'indigo', name: 'Indigo', colors: ['#283593', '#818CF8'] },
    { id: 'velvet', name: 'Velvet', colors: ['#1E1B26', '#9D4EDD'] },
    { id: 'copper', name: 'Copper', colors: ['#4a2c2a', '#da8a67'] },
    { id: 'crimson-red', name: 'Crimson Red', colors: ['#FEF2F2', '#F87171'] },
    
    // Natural & Earthy
    { id: 'forest-green', name: 'Forest', colors: ['#F0FDF4', '#4ADE80'] },
    { id: 'jungle', name: 'Jungle', colors: ['#F0FFF4', '#10B981'] },
    { id: 'earthy-tones', name: 'Earthy', colors: ['#FEFCE8', '#854d0e'] },
    { id: 'olive', name: 'Olive', colors: ['#F4FCE8', '#A3CC4A'] },
    { id: 'sandstone', name: 'Sandstone', colors: ['#FDF6E3', '#B8860B'] },
    { id: 'mocha', name: 'Mocha', colors: ['#FDF4E6', '#D4A574'] },
    
    // Bright & Fun
    { id: 'goldenrod', name: 'Goldenrod', colors: ['#FEFCE8', '#FACC15'] },
    { id: 'minty-fresh', name: 'Minty', colors: ['#F0FDF4', '#6EE7B7'] },
    { id: 'coral', name: 'Coral', colors: ['#FFF1F2', '#FB7185'] },
    { id: 'sunrise-orange', name: 'Sunrise', colors: ['#FFF7ED', '#FB923C'] },
    { id: 'bubblegum', name: 'Bubblegum', colors: ['#FDF2F8', '#EC4899'] },
    
    // Unique & Themed
    { id: 'gothic', name: 'Gothic', colors: ['#171717', '#737373'] },
    { id: 'rose-gold', name: 'Rose Gold', colors: ['#FFF1F2', '#F4C4C4'] },
    { id: 'vintage-paper', name: 'Vintage', colors: ['#FDFBF6', '#D4CFCB'] },
    { id: 'deep-space', name: 'Deep Space', colors: ['#030712', '#3B82F6'] },
    { id: 'nordic-blue', name: 'Nordic Blue', colors: ['#2e3440', '#88c0d0'] },
    { id: 'teal', name: 'Teal', colors: ['#F0FDFA', '#2DD4BF'] },
    { id: 'beach-vibes', name: 'Beach', colors: ['#FFFBEB', '#F59E0B'] },
    { id: 'custom', name: 'Custom', colors: ['#DDDDDD', '#888888'] },
];

export default function AppearancePage() {
  const { toast } = useToast();
  const { user, loading: authLoading, setUser } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [customGradientsEnabled, setCustomGradientsEnabled] = useState(false);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const form = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "light",
      animatedBackground: false,
      buttonStyle: 'solid',
      customThemeGradient: { from: '#FFFFFF', to: '#AAAAAA' },
      customButtonGradient: { from: '#AAAAAA', to: '#FFFFFF' },
    },
  });
  
  const watchedValues = form.watch();

  useEffect(() => {
    if (user) {
        const isCustom = user.theme === 'custom';
        setCustomGradientsEnabled(isCustom);
        form.reset({
            theme: user.theme || 'light',
            animatedBackground: user.animatedBackground || false,
            buttonStyle: user.buttonStyle || 'solid',
            customThemeGradient: user.customThemeGradient || { from: '#FFFFFF', to: '#AAAAAA' },
            customButtonGradient: user.customButtonGradient || { from: '#AAAAAA', to: '#FFFFFF' },
        });
    }
  }, [user, form]);
  
  useEffect(() => {
    const currentTheme = form.getValues('theme');
    if (customGradientsEnabled) {
        if (currentTheme !== 'custom') {
            form.setValue('theme', 'custom');
        }
    } else {
        if (currentTheme === 'custom') {
            form.setValue('theme', user?.theme !== 'custom' ? user?.theme || 'light' : 'light');
        }
    }
  }, [customGradientsEnabled, form, user?.theme]);

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
        const dataToUpdate = {
          ...values,
          theme: customGradientsEnabled ? 'custom' : values.theme,
        };
        await updateDoc(userRef, dataToUpdate);
        setUser((prevUser) => prevUser ? { ...prevUser, ...dataToUpdate } : null);
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
  
  const previewProfile: Partial<UserProfile> = {
    ...user,
    ...watchedValues,
    theme: customGradientsEnabled ? 'custom' : watchedValues.theme,
    bot: user?.bot, // Ensure bot data is passed to the preview
  };

  const ThemeCardContent = () => (
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
                <CarouselContent className="-ml-1">
                    {themes.map((theme) => (
                    <CarouselItem key={theme.id} className={cn("basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/4 xl:basis-1/5 pl-1", theme.id === 'custom' && !customGradientsEnabled ? 'hidden' : '')}>
                        <div className="p-1">
                            <button 
                                type="button"
                                disabled={theme.id === 'custom'}
                                className={cn(
                                    "w-full aspect-square rounded-lg flex items-center justify-center border-2 cursor-pointer transition-all",
                                    field.value === theme.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-primary/50',
                                    theme.id === 'custom' && 'cursor-not-allowed opacity-50'
                                )}
                                onClick={() => {
                                if (theme.id !== 'custom') {
                                    setCustomGradientsEnabled(false);
                                    field.onChange(theme.id)
                                }
                                }}
                            >
                                <div className="w-10 h-10 rounded-full flex overflow-hidden border" style={{ background: `linear-gradient(45deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)` }}></div>
                            </button>
                            <p className="text-xs text-center mt-1 text-muted-foreground truncate">{theme.name}</p>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
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
  );

  const ButtonCardContent = () => (
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
                        className="grid grid-cols-2 gap-4"
                    >
                        <FormItem>
                        <RadioGroupItem value="solid" id="solid" className="peer sr-only" />
                        <Label htmlFor="solid" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <div className="h-6 w-full rounded-md bg-secondary mb-2"></div>
                            Solid
                        </Label>
                        </FormItem>
                        <FormItem>
                        <RadioGroupItem value="gradient" id="gradient" className="peer sr-only" />
                        <Label htmlFor="gradient" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <div className="h-6 w-full rounded-md bg-gradient-to-r from-secondary to-primary mb-2"></div>
                            Gradient
                        </Label>
                        </FormItem>
                    </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </CardContent>
    </Card>
  );

  const CustomGradientCardContent = () => (
    <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Custom Gradients</CardTitle>
                <CardDescription>Create your own unique gradients. This enables the 'Custom' theme.</CardDescription>
            </div>
                <Switch
                checked={customGradientsEnabled}
                onCheckedChange={setCustomGradientsEnabled}
                />
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label className="font-medium">Theme Gradient</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                    control={form.control}
                    name="customThemeGradient.from"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">From</FormLabel>
                            <FormControl>
                            <ColorPicker value={field.value ?? ''} onChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="customThemeGradient.to"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">To</FormLabel>
                            <FormControl>
                            <ColorPicker value={field.value ?? ''} onChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
            </div>
            <div>
                <Label className="font-medium">Button Gradient</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                    control={form.control}
                    name="customButtonGradient.from"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">From</FormLabel>
                            <FormControl>
                            <ColorPicker value={field.value ?? ''} onChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="customButtonGradient.to"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">To</FormLabel>
                            <FormControl>
                            <ColorPicker value={field.value ?? ''} onChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
            </div>
                <Button type="button" variant="outline" onClick={() => forceUpdate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Preview
            </Button>
        </CardContent>
    </Card>
  );


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:sticky lg:top-6 space-y-6">
        <div className="relative h-[500px] lg:h-[700px] w-full max-w-sm mx-auto">
            <PublicProfilePreview 
                profile={previewProfile} 
                links={links} 
                isPreview 
                showBot={true}
            />
        </div>
      </div>
      
      <div className="space-y-6 lg:mt-0 mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mobile View: Carousel */}
            <div className="lg:hidden space-y-4">
               <Carousel className="w-full">
                <CarouselContent>
                    <CarouselItem>{ThemeCardContent()}</CarouselItem>
                    <CarouselItem>{ButtonCardContent()}</CarouselItem>
                    <CarouselItem>{CustomGradientCardContent()}</CarouselItem>
                </CarouselContent>
               </Carousel>
            </div>

            {/* Desktop View: Stacked Cards */}
            <div className="hidden lg:block space-y-6">
              <ThemeCardContent />
              <ButtonCardContent />
              <CustomGradientCardContent />
            </div>

            <Button type="submit" disabled={formLoading} className="w-full lg:w-auto">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Appearance
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
