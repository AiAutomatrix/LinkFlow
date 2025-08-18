
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Instagram, Facebook, Github, Loader2, Share2, Coffee, Bitcoin, Banknote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LinkForm from "./_components/link-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";

const EthIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground"><title>Ethereum</title><path d="M11.944 17.97L4.58 13.62 11.943 24l7.365-10.38-7.364 4.35zM12.056 0L4.69 12.223l7.366-4.354 7.365 4.354L12.056 0z"/></svg>
);
const SolIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground"><title>Solana</title><path d="M4.236.427a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533V-.001a.6.6 0 00-.128-.532.6.6 0 00-.49-.28L4.236.427zm10.02 6.046a.6.6 0 00-.532.127a.6.6 0 00-.28.491v4.54a.6.6 0 00.28.49.6.6 0 00.532.128l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.532V5.76a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12zm-4.383 6.64a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533v-4.54a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12z"/></svg>
);

const socialLinksSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    github: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

const supportLinksSchema = z.object({
    buyMeACoffee: z.string().url({ message: "Please enter a valid 'Buy Me a Coffee' URL."}).optional().or(z.literal('')),
    etransfer: z.string().email({ message: "Please enter a valid E-Transfer email." }).optional().or(z.literal('')),
    btc: z.string().optional(),
    eth: z.string().optional(),
    sol: z.string().optional(),
});


export default function LinksPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const socialForm = useForm<z.infer<typeof socialLinksSchema>>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: { email: "", instagram: "", facebook: "", github: "" },
  });

  const supportForm = useForm<z.infer<typeof supportLinksSchema>>({
    resolver: zodResolver(supportLinksSchema),
    defaultValues: { buyMeACoffee: "", etransfer: "", btc: "", eth: "", sol: "" }
  });

  useEffect(() => {
    if (!user) return;
    
    const linksCollection = collection(db, `users/${user.uid}/links`);
    const q = query(linksCollection, orderBy("order"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const linksData: Link[] = [];
        const socialLinksValues: Partial<z.infer<typeof socialLinksSchema>> = {};
        const supportLinksValues: Partial<z.infer<typeof supportLinksSchema>> = {};

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
            if (link.isSupport) {
                const platformMap: { [key: string]: keyof z.infer<typeof supportLinksSchema> } = {
                    'buy me a coffee': 'buyMeACoffee',
                    'e-transfer': 'etransfer',
                    'btc': 'btc',
                    'eth': 'eth',
                    'sol': 'sol'
                };
                const platformKey = platformMap[link.title.toLowerCase()];

                if(platformKey) {
                    if (platformKey === 'etransfer') { // E-Transfer
                        (supportLinksValues as any)[platformKey] = link.url.replace('mailto:', '');
                    } else {
                        (supportLinksValues as any)[platformKey] = link.url;
                    }
                }
            }
        });
        
        setLinks(linksData);
        socialForm.reset({
            email: socialLinksValues.email || '',
            instagram: socialLinksValues.instagram || '',
            facebook: socialLinksValues.facebook || '',
            github: socialLinksValues.github || '',
        });
        supportForm.reset({
            buyMeACoffee: supportLinksValues.buyMeACoffee || '',
            etransfer: supportLinksValues.etransfer || '',
            btc: supportLinksValues.btc || '',
            eth: supportLinksValues.eth || '',
            sol: supportLinksValues.sol || '',
        });

        setLoading(false);
    }, (error) => {
        console.error("Error fetching links: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch links." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast, socialForm, supportForm]);


  const handleShare = () => {
    if (!user) return;
    const publicUrl = `${window.location.origin}/u/${user.username}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
        title: "Link Copied!",
        description: "Your public profile URL has been copied to your clipboard.",
    });
  }

  const handleBatchUpdate = async (
    values: Record<string, string | undefined>,
    type: 'social' | 'support'
  ) => {
    if (!user) return;
    const linksCollection = collection(db, `users/${user.uid}/links`);
    const batch = writeBatch(db);
    const existingLinks = links.filter(
        (l) => (type === 'social' && l.isSocial) || (type === 'support' && l.isSupport)
    );

     const platformConfig: { [key: string]: { title: string; order: number; urlPrefix?: string; isSocial: boolean; isSupport: boolean } } = {
        // Social
        email: { title: 'Email', order: 1000, urlPrefix: 'mailto:', isSocial: true, isSupport: false },
        instagram: { title: 'Instagram', order: 1001, isSocial: true, isSupport: false },
        facebook: { title: 'Facebook', order: 1002, isSocial: true, isSupport: false },
        github: { title: 'Github', order: 1003, isSocial: true, isSupport: false },
        // Support
        buyMeACoffee: { title: 'Buy Me A Coffee', order: 2000, isSocial: false, isSupport: true },
        etransfer: { title: 'E-Transfer', order: 2001, urlPrefix: 'mailto:', isSocial: false, isSupport: true },
        btc: { title: 'BTC', order: 2002, isSocial: false, isSupport: true },
        eth: { title: 'ETH', order: 2003, isSocial: false, isSupport: true },
        sol: { title: 'SOL', order: 2004, isSocial: false, isSupport: true },
    };

    const isUpdatingSocial = type === 'social';

    for (const [key, url] of Object.entries(values)) {
        const config = platformConfig[key];
        if (!config) continue;

         if ((isUpdatingSocial && !config.isSocial) || (!isUpdatingSocial && !config.isSupport)) {
            continue;
        }

        const existingLink = existingLinks.find((l) => l.title === config.title);

        if (url && url.trim() !== '') {
            const finalUrl = config.urlPrefix ? `${config.urlPrefix}${url}` : url;
            if (existingLink) {
                batch.update(doc(db, `users/${user.uid}/links`, existingLink.id), { url: finalUrl, active: true });
            } else {
                const newLinkRef = doc(collection(db, `users/${user.uid}/links`));
                batch.set(newLinkRef, {
                    title: config.title,
                    url: finalUrl,
                    order: config.order,
                    active: true,
                    clicks: 0,
                    createdAt: new Date(),
                    isSocial: config.isSocial,
                    isSupport: config.isSupport,
                });
            }
        } else {
            if (existingLink) {
                batch.delete(doc(db, `users/${user.uid}/links`, existingLink.id));
            }
        }
    }

    await batch.commit();
};


  const handleSocialSubmit = async (values: z.infer<typeof socialLinksSchema>) => {
    setLoadingSocial(true);
    try {
        await handleBatchUpdate(values, 'social');
        toast({ title: "Social links updated!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setLoadingSocial(false);
    }
  }

  const handleSupportSubmit = async (values: z.infer<typeof supportLinksSchema>) => {
    setLoadingSupport(true);
    try {
        await handleBatchUpdate(values, 'support');
        toast({ title: "Support links updated!" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update support links.' });
    } finally {
        setLoadingSupport(false);
    }
  }
  
  const handleAddLink = async (title: string, url: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;
    
    const maxOrder = links.filter(l => !l.isSocial && !l.isSupport)
                           .reduce((max, link) => Math.max(max, link.order), -1);

    const newLink: Omit<Link, 'id'> = {
        title,
        url,
        order: maxOrder + 1,
        active: true,
        clicks: 0,
        createdAt: new Date(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isSocial: false,
        isSupport: false,
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
    
    const regularLinks = links.filter(l => !l.isSocial && !l.isSupport).sort((a, b) => a.order - b.order);
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

  const sortedLinks = [...links].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-muted-foreground">
              Add, edit, and reorder all of your links.
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
                  <DialogDescription>
                    Add a new link to your profile. You can schedule it to appear at a later date.
                  </DialogDescription>
                  </DialogHeader>
                  <LinkForm onSubmit={handleAddLink} onCancel={() => setDialogOpen(false)} />
              </DialogContent>
              </Dialog>
          </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Your Links</CardTitle>
                  <CardDescription>
                    Manage your custom links and social icons. Click the arrows on
                    custom links to reorder them.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedLinks.length > 0 ? (
                    <div className="space-y-4">
                      {sortedLinks.map((link) => (
                        <LinkCard
                          key={link.id}
                          index={
                            link.isSocial || link.isSupport
                              ? -1
                              : links.filter((l) => !l.isSocial && !l.isSupport).sort((a,b) => a.order - b.order).findIndex((l) => l.id === link.id)
                          }
                          totalLinks={links.filter((l) => !l.isSocial && !l.isSupport).length}
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
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
            <Form {...socialForm}>
              <form onSubmit={socialForm.handleSubmit(handleSocialSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Social Icons</CardTitle>
                    <CardDescription>
                      Add or update your social media URLs. Clear an input to remove
                      the icon.
                    </CardDescription>
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
                              <Input
                                placeholder="your@email.com"
                                className="pl-10"
                                {...field}
                              />
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
                              <Input
                                placeholder="https://instagram.com/..."
                                className="pl-10"
                                {...field}
                              />
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
                              <Input
                                placeholder="https://facebook.com/..."
                                className="pl-10"
                                {...field}
                              />
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
                              <Input
                                placeholder="https://github.com/..."
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={loadingSocial}>
                        {loadingSocial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Social Icons
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
            
            <Form {...supportForm}>
                <form onSubmit={supportForm.handleSubmit(handleSupportSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Support & Donation Links</CardTitle>
                            <CardDescription>Add links for your supporters to send you tips and donations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={supportForm.control}
                                name="buyMeACoffee"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Buy Me a Coffee</FormLabel>
                                    <div className="relative flex items-center">
                                        <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                        <Input
                                            placeholder="https://www.buymeacoffee.com/..."
                                            className="pl-10"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={supportForm.control}
                                name="etransfer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>E-Transfer Email</FormLabel>
                                    <div className="relative flex items-center">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                        <Input
                                            placeholder="your.email@example.com"
                                            className="pl-10"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={supportForm.control}
                                name="btc"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Bitcoin Address</FormLabel>
                                    <div className="relative flex items-center">
                                        <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                        <Input
                                            placeholder="bc1q..."
                                            className="pl-10"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={supportForm.control}
                                name="eth"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Ethereum Address</FormLabel>
                                    <div className="relative flex items-center">
                                        <EthIcon />
                                        <FormControl>
                                        <Input
                                            placeholder="0x..."
                                            className="pl-10"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={supportForm.control}
                                name="sol"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Solana Address</FormLabel>
                                    <div className="relative flex items-center">
                                        <SolIcon />
                                        <FormControl>
                                        <Input
                                            placeholder="SoL..."
                                            className="pl-10"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={loadingSupport}>
                                {loadingSupport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Support Links
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

          </div>
        </div>
    </>
  );
}
