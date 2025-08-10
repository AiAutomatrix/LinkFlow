
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Instagram, Facebook, Github, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Link, UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import LinkCard from "./_components/link-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LinkForm from "./_components/link-form";
import { useToast } from "@/hooks/use-toast";
import PublicProfilePreview from "../appearance/_components/public-profile-preview";
import { useAuth } from "@/contexts/auth-context";


const socialLinksSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    github: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});


export default function LinksPage() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const socialForm = useForm<z.infer<typeof socialLinksSchema>>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      email: "",
      instagram: "",
      facebook: "",
      github: ""
    },
  });

  const watchedSocials = socialForm.watch();

  useEffect(() => {
    // Mock loading
    const timer = setTimeout(() => {
        setLinks([
            { id: '1', title: 'My Portfolio', url: 'https://example.com', order: 0, active: true, clicks: 101 },
            { id: '2', title: 'My Blog', url: 'https://example.com', order: 1, active: true, clicks: 256 },
            { id: '3', title: 'Project Website', url: 'https://example.com', order: 2, active: false, clicks: 42 },
        ]);
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userProfile?.socialLinks) {
        socialForm.reset(userProfile.socialLinks);
    }
  }, [userProfile, socialForm]);


  const handleSocialSubmit = async (values: z.infer<typeof socialLinksSchema>) => {
    setLoadingSocial(true);
    console.log("Updating social links:", values);
    setTimeout(() => {
        toast({ title: "Social links updated!" });
        setLoadingSocial(false);
    }, 1000);
  }
  
  const handleAddLink = (title: string, url: string, startDate?: Date, endDate?: Date) => {
    const newLink: Link = {
        id: (links.length + 1).toString(),
        title,
        url,
        order: links.length,
        active: true,
        clicks: 0,
        createdAt: new Date(),
        startDate,
        endDate
    };
    setLinks([...links, newLink]);
    setDialogOpen(false);
  };
  
  const handleUpdateLink = (linkId: string, data: Partial<Link>) => {
    setLinks(links.map(l => l.id === linkId ? { ...l, ...data } : l));
  };
  
  const handleDeleteLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId));
  };

  const handleMoveLink = (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = links.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    const [movedLink] = newLinks.splice(currentIndex, 1);
    newLinks.splice(newIndex, 0, movedLink);

    setLinks(newLinks.map((l, i) => ({ ...l, order: i })));
  };
  
  if (authLoading) {
      return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Links</h1>
                <p className="text-muted-foreground">
                    Add, edit, and reorder your links.
                </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Link
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Add a new link</DialogTitle>
                    </DialogHeader>
                    <LinkForm onSubmit={handleAddLink} onCancel={() => setDialogOpen(false)} />
                </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                <CardTitle>Your Links</CardTitle>
                <CardDescription>Click the arrows to reorder, or the switch to toggle visibility.</CardDescription>
                </CardHeader>
                <CardContent>
                {loading ? (
                    <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    </div>
                ) : links.length > 0 ? (
                    <div className="space-y-4">
                        {links.map((link, index) => (
                        <LinkCard 
                            key={link.id} 
                            index={index}
                            totalLinks={links.length}
                            link={link} 
                            onUpdate={handleUpdateLink}
                            onDelete={handleDeleteLink}
                            onMove={handleMoveLink}
                        />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                    <h3 className="text-lg font-semibold">No links yet</h3>
                    <p className="text-muted-foreground mt-1">
                        Click "Add Link" to get started.
                    </p>
                    </div>
                )}
                </CardContent>
            </Card>

            <Form {...socialForm}>
                <form onSubmit={socialForm.handleSubmit(handleSocialSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Links</CardTitle>
                            <CardDescription>Add links to your social media profiles. These will be tracked in your analytics.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                            control={socialForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="your@email.com" className="pl-10" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={socialForm.control}
                            name="instagram"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Instagram</FormLabel>
                                <div className="relative flex items-center">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="https://instagram.com/..." className="pl-10" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={socialForm.control}
                            name="facebook"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Facebook</FormLabel>
                                <div className="relative flex items-center">
                                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="https://facebook.com/..." className="pl-10" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={socialForm.control}
                            name="github"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>GitHub</FormLabel>
                                <div className="relative flex items-center">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="https://github.com/..." className="pl-10" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </CardContent>
                    </Card>
                    <Button type="submit" disabled={loadingSocial} className="mt-6">
                        {loadingSocial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Social Links
                    </Button>
                </form>
            </Form>
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2">
            <PublicProfilePreview 
                profile={userProfile || {}}
                links={links} 
                socialLinks={watchedSocials}
            />
        </div>
    </div>
  );
}
