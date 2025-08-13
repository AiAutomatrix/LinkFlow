
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Instagram, Facebook, Github, Loader2, Share2 } from "lucide-react";
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
import type { Link } from "@/lib/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, writeBatch, deleteDoc, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";


const socialLinksSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    github: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});


export default function LinksPage() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
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
    if (!user) return;

    const linksCollection = collection(db, `users/${user.uid}/links`);
    const q = query(linksCollection, orderBy("order"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const linksData: Link[] = [];
        const socialLinksValues: Partial<z.infer<typeof socialLinksSchema>> = {};

        querySnapshot.forEach((doc) => {
            const link = { id: doc.id, ...doc.data() } as Link;
            linksData.push(link);

            if(link.isSocial) {
                const platform = link.title.toLowerCase() as keyof z.infer<typeof socialLinksSchema>;
                if (platform === 'email') {
                    socialLinksValues[platform] = link.url.replace('mailto:', '');
                } else {
                    socialLinksValues[platform] = link.url;
                }
            }
        });
        setLinks(linksData);
        socialForm.reset(socialLinksValues);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching links: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch links." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast, socialForm]);


  const handleShare = () => {
    if (!userProfile) return;
    const publicUrl = `${window.location.origin}/u/${userProfile.username}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
        title: "Link Copied!",
        description: "Your public profile URL has been copied to your clipboard.",
    });
  }

  const handleSocialSubmit = async (values: z.infer<typeof socialLinksSchema>) => {
    if (!user) return;
    setLoadingSocial(true);
    const linksCollection = collection(db, `users/${user.uid}/links`);

    try {
        const batch = writeBatch(db);

        for (const [platform, url] of Object.entries(values)) {
            if (!url) continue;

            const q = query(linksCollection, where("title", "==", platform), where("isSocial", "==", true));
            const existingLinks = await getDocs(q);

            const finalUrl = platform === 'email' ? `mailto:${url}` : url;

            if (existingLinks.empty) {
                const newLink = {
                    title: platform,
                    url: finalUrl,
                    order: links.filter(l => !l.isSocial).length + Object.keys(values).indexOf(platform), // place after regular links
                    active: true,
                    clicks: 0,
                    createdAt: new Date(),
                    startDate: null,
                    endDate: null,
                    isSocial: true,
                };
                const newLinkRef = doc(linksCollection);
                batch.set(newLinkRef, newLink);
            } else {
                existingLinks.forEach(doc => {
                    batch.update(doc.ref, { url: finalUrl });
                });
            }
        }
        
        await batch.commit();
        toast({ title: "Social links updated!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setLoadingSocial(false);
    }
  }
  
  const handleAddLink = async (title: string, url: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;
    const newLink: Omit<Link, 'id'> = {
        title,
        url,
        order: links.filter(l => !l.isSocial).length, // Only count non-social links for order
        active: true,
        clicks: 0,
        createdAt: new Date(),
        startDate: startDate || null,
        endDate: endDate || null,
        isSocial: false,
    };
    try {
        await addDoc(collection(db, `users/${user.uid}/links`), newLink);
        toast({ title: "Link added successfully!" });
        setDialogOpen(false);
    } catch (error: any) {
         toast({ variant: 'destructive', title: "Error", description: "Failed to add link." });
    }
  };
  
  const handleUpdateLink = async (linkId: string, data: Partial<Omit<Link, 'id'>>) => {
    if (!user) return;
    const linkRef = doc(db, `users/${user.uid}/links`, linkId);
    try {
        await updateDoc(linkRef, data);
        toast({ title: "Link updated successfully!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to update link." });
    }
  };
  
  const handleDeleteLink = async (linkId: string) => {
    if (!user) return;
    const linkRef = doc(db, `users/${user.uid}/links`, linkId);
    try {
        await deleteDoc(linkRef);
        toast({ title: "Link deleted." });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete link." });
    }
  };

  const handleMoveLink = async (linkId: string, direction: 'up' | 'down') => {
    if (!user) return;
    
    const regularLinks = links.filter(l => !l.isSocial);
    const currentIndex = regularLinks.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= regularLinks.length) return;

    const newOrderedLinks = [...regularLinks];
    const [movedLink] = newOrderedLinks.splice(currentIndex, 1);
    newOrderedLinks.splice(newIndex, 0, movedLink);

    const batch = writeBatch(db);
    newOrderedLinks.forEach((link, index) => {
        const linkRef = doc(db, `users/${user.uid}/links`, link.id);
        batch.update(linkRef, { order: index });
    });
    
    try {
        await batch.commit();
        toast({ title: "Links reordered!" });
    } catch (error) {
         toast({ variant: 'destructive', title: "Error", description: "Failed to reorder links." });
    }
  };
  
  if (authLoading || loading) {
      return <Loading />;
  }

  const regularLinks = links.filter(l => !l.isSocial);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                <h1 className="text-2xl font-bold">Links</h1>
                <p className="text-muted-foreground">
                    Add, edit, and reorder your links.
                </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
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
            </div>

            <Card>
                <CardHeader>
                <CardTitle>Your Links</CardTitle>
                <CardDescription>Click the arrows to reorder, or the switch to toggle visibility.</CardDescription>
                </CardHeader>
                <CardContent>
                {regularLinks.length > 0 ? (
                    <div className="space-y-4">
                        {regularLinks.map((link, index) => (
                        <LinkCard 
                            key={link.id} 
                            index={index}
                            totalLinks={regularLinks.length}
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
                            <CardTitle>Social Icons</CardTitle>
                            <CardDescription>Add URLs to your social media profiles. These will appear as icons on your page.</CardDescription>
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
                        Update Social Icons
                    </Button>
                </form>
            </Form>
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2">
            <PublicProfilePreview 
                profile={userProfile || {}}
                links={links} 
            />
        </div>
    </div>
  );
}

    