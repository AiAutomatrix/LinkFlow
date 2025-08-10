
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import PublicProfilePreview from "./_components/public-profile-preview";
import type { Link } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";

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
  theme: z.string().optional(),
  animatedBackground: z.boolean().optional(),
});

const themes = [
    { id: 'light', name: 'Light', colors: ['#FFFFFF', '#E2E8F0'] },
    { id: 'dark', name: 'Dark', colors: ['#1A202C', '#4A5568'] },
    { id: 'neon-green', name: 'Neon Green', colors: ['#0F172A', '#34D399'] },
    { id: 'neon-pink', name: 'Neon Pink', colors: ['#1E1B4B', '#F472B6'] },
    { id: 'gradient-sunset', name: 'Sunset', colors: ['#FECACA', '#F9A8D4'] },
    { id: 'ocean-blue', name: 'Ocean Blue', colors: ['#E0F2FE', '#38BDF8'] },
    { id: 'forest-green', name: 'Forest Green', colors: ['#F0FDF4', '#4ADE80'] },
    { id: 'royal-purple', name: 'Royal Purple', colors: ['#F5F3FF', '#A78BFA'] },
    { id: 'crimson-red', name: 'Crimson Red', colors: ['#FEF2F2', '#F87171'] },
    { id: 'goldenrod', name: 'Goldenrod', colors: ['#FEFCE8', '#FACC15'] },
    { id: 'minty-fresh', name: 'Minty Fresh', colors: ['#F0FDF4', '#6EE7B7'] },
    { id: 'charcoal', name: 'Charcoal', colors: ['#334155', '#94A3B8'] },
    { id: 'lavender', name: 'Lavender', colors: ['#F5F3FF', '#C4B5FD'] },
    { id: 'mocha', name: 'Mocha', colors: ['#FDF4E6', '#D4A574'] },
    { id: 'teal', name: 'Teal', colors: ['#F0FDFA', '#2DD4BF'] },
    { id: 'coral', name: 'Coral', colors: ['#FFF1F2', '#FB7185'] },
    { id: 'indigo', name: 'Indigo', colors: ['#283593', '#818CF8'] },
    { id: 'olive', name: 'Olive', colors: ['#F4FCE8', '#A3CC4A'] },
    { id: 'rose-gold', name: 'Rose Gold', colors: ['#FFF1F2', '#F4C4C4'] },
    { id: 'slate', name: 'Slate', colors: ['#475569', '#E2E8F0'] },
  ];

export default function AppearancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState("");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "Demo User",
      username: "username",
      bio: "This is a bio for the demo user.",
      theme: "light",
      animatedBackground: false,
    },
  });
  
  const watchedValues = form.watch();

  useEffect(() => {
    // Mock data for links
    setLinks([
      { id: '1', title: 'My Portfolio', url: 'https://example.com', order: 0, active: true, clicks: 101 },
      { id: '2', title: 'My Blog', url: 'https://example.com', order: 1, active: true, clicks: 256 },
    ]);
  }, []);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    console.log("Updating profile", values);
    setTimeout(() => {
        toast({ title: "Profile updated successfully!" });
        setLoading(false);
    }, 1000);
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    setUploading(true);

    // Mock upload
    setTimeout(() => {
      const newPhotoURL = URL.createObjectURL(file);
      setPhotoURL(newPhotoURL);
      setUploading(false);
      toast({ title: "Profile picture updated!" });
    }, 1500);
  };

  const getInitials = (name: string = "") => {
    return name.split(" ").map((n) => n[0]).join("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
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
                      <Input placeholder="your_unique_name" {...field} />
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
                            <CarouselItem key={theme.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
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


            <Button type="submit" disabled={loading || uploading}>
                {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
            </Button>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-1 order-1 lg:order-2">
        <PublicProfilePreview profile={{...watchedValues, photoURL}} links={links} socialLinks={{}} />
      </div>
    </div>
  );
}
