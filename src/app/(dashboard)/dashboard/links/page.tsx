
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
import { useAuth } from "@/contexts/auth-context";
import { firestore } from "@/lib/firebase";
import type { Link, UserProfile } from "@/lib/types";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
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


const socialLinksSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    github: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});


export default function LinksPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [socialLinks, setSocialLinks] = useState<UserProfile['socialLinks']>({});
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
    if (user?.socialLinks) {
      setSocialLinks(user.socialLinks);
      socialForm.reset(user.socialLinks);
    }
  }, [user, socialForm.reset]);


  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const linksCollection = collection(firestore, "users", user.uid, "links");
    const q = query(linksCollection, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const linksData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
        } as Link;
      }).filter(link => !link.isSocial); // Only user-created links
      setLinks(linksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSocialSubmit = async (values: z.infer<typeof socialLinksSchema>) => {
    if (!user) return;
    setLoadingSocial(true);
    
    try {
        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, "users", user.uid);

        batch.update(userDocRef, { socialLinks: values });

        // Manage social links as trackable link documents
        const socialLinkPlatforms = ['email', 'instagram', 'facebook', 'github'];

        for (const platform of socialLinkPlatforms) {
            const linkId = `social_${platform}`;
            const url = values[platform as keyof typeof values];
            const socialLinkRef = doc(firestore, `users/${user.uid}/links`, linkId);

            if (url) {
                const linkDoc = await getDoc(socialLinkRef);
                const linkData = {
                    title: platform.charAt(0).toUpperCase() + platform.slice(1),
                    url: platform === 'email' ? `mailto:${url}` : url,
                    clicks: linkDoc.exists() ? linkDoc.data().clicks : 0,
                    active: true,
                    order: -1, // Keep social links separate
                    isSocial: true,
                    createdAt: linkDoc.exists() ? linkDoc.data().createdAt : serverTimestamp(),
                };

                batch.set(socialLinkRef, linkData, { merge: true });

            } else {
                // If URL is removed, delete the social link document
                const linkDoc = await getDoc(socialLinkRef);
                if (linkDoc.exists()){
                    batch.delete(socialLinkRef);
                }
            }
        }

        await batch.commit();

        setUser(prevUser => prevUser ? { ...prevUser, socialLinks: values } : null);
        setSocialLinks(values);
        toast({ title: "Social links updated!" });
    } catch (error) {
        console.error("Error updating social links:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update social links.' });
    } finally {
        setLoadingSocial(false);
    }
  }
  
  const handleAddLink = async (title: string, url: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;
    const linksCollection = collection(firestore, 'users', user.uid, 'links');
    
    const newLinkData: Omit<Link, 'id' | 'createdAt' | 'startDate' | 'endDate'> & { createdAt: any, startDate?: Timestamp, endDate?: Timestamp } = {
        title,
        url,
        order: links.length,
        active: true,
        clicks: 0,
        createdAt: serverTimestamp(),
    };

    if (startDate) {
        newLinkData.startDate = Timestamp.fromDate(startDate);
    }
    if (endDate) {
        newLinkData.endDate = Timestamp.fromDate(endDate);
    }

    await addDoc(linksCollection, newLinkData);
    setDialogOpen(false);
  };
  
  const handleUpdateLink = async (linkId: string, data: Partial<Link>) => {
    if (!user) return;
    const linkDocRef = doc(firestore, 'users', user.uid, 'links', linkId);
    
    const updateData: any = { ...data };
    
    // Handle date conversion or removal
    if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate as Date);
    } else if (data.hasOwnProperty('startDate')) {
        updateData.startDate = null;
    }

    if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate as Date);
    } else if (data.hasOwnProperty('endDate')) {
        updateData.endDate = null;
    }


    await updateDoc(linkDocRef, updateData);
  };
  
  const handleDeleteLink = async (linkId: string) => {
    if (!user) return;
    const linkDocRef = doc(firestore, 'users', user.uid, 'links', linkId);
    await deleteDoc(linkDocRef);
    
    // Re-order remaining links
    const batch = writeBatch(firestore);
    links.filter(l => l.id !== linkId).forEach((link, index) => {
      const docRef = doc(firestore, 'users', user!.uid, 'links', link.id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
  };

  const handleMoveLink = async (linkId: string, direction: 'up' | 'down') => {
    if (!user) return;

    const currentIndex = links.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    const [movedLink] = newLinks.splice(currentIndex, 1);
    newLinks.splice(newIndex, 0, movedLink);

    const batch = writeBatch(firestore);
    newLinks.forEach((link, index) => {
      const docRef = doc(firestore, 'users', user.uid, 'links', link.id);
      batch.update(docRef, { order: index });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to reorder links:", error);
    }
  };

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
            {user && (
                 <PublicProfilePreview 
                    profile={user} 
                    links={links} 
                    socialLinks={watchedSocials}
                />
            )}
        </div>
    </div>
  );
}
