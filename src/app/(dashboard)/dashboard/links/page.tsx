
"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { firestore } from "@/lib/firebase";
import type { Link } from "@/lib/types";
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
} from "firebase/firestore";
import { useEffect, useState } from "react";
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


export default function LinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);

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
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
        } as Link;
      });
      setLinks(linksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const handleAddLink = async (title: string, url: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;
    const linksCollection = collection(firestore, 'users', user.uid, 'links');
    
    const newLinkData: any = {
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
  
  const handleUpdateLink = async (linkId: string, title: string, url: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;
    const linkDocRef = doc(firestore, 'users', user.uid, 'links', linkId);
    
    const updateData: any = { title, url };
    
    updateData.startDate = startDate ? Timestamp.fromDate(startDate) : null;
    updateData.endDate = endDate ? Timestamp.fromDate(endDate) : null;

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
      // Optionally revert state on error
    }
  };

  return (
    <div className="space-y-6">
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
          <CardDescription>Click the arrows to reorder.</CardDescription>
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
    </div>
  );
}
