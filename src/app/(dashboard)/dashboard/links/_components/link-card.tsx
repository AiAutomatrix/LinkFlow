
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Link } from "@/lib/types";
import { MoreHorizontal, Pencil, Trash2, CalendarDays, ArrowUp, ArrowDown } from "lucide-react";
import LinkForm from "./link-form";
import { useState } from "react";
import { format } from 'date-fns';
import { Timestamp } from "firebase/firestore";

type LinkCardProps = {
  link: Link;
  index: number;
  totalLinks: number;
  onUpdate: (linkId: string, title: string, url: string, startDate?: Date, endDate?: Date) => void;
  onDelete: (linkId: string) => void;
  onMove: (linkId: string, direction: 'up' | 'down') => void;
};

// Helper to convert Timestamp to Date if needed
const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    return undefined;
}


export default function LinkCard({ link, index, totalLinks, onUpdate, onDelete, onMove }: LinkCardProps) {
    const [isEditOpen, setEditOpen] = useState(false);
  
    const handleUpdate = (title: string, url: string, startDate?: Date, endDate?: Date) => {
      onUpdate(link.id, title, url, startDate, endDate);
      setEditOpen(false);
    };

    const hasSchedule = link.startDate || link.endDate;
    const startDate = toDate(link.startDate);
    const endDate = toDate(link.endDate);

    return (
        <Card className="flex items-center p-3 gap-3">
            <div className="flex flex-col gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(link.id, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(link.id, 'down')} disabled={index === totalLinks - 1}>
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-grow">
                <p className="font-semibold">{link.title}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                {hasSchedule && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                            {startDate ? format(startDate, "LLL d") : 'Always'}
                            {' → '}
                            {endDate ? format(endDate, "LLL d, y") : 'Never'}
                        </span>
                    </div>
                )}
            </div>
            <div className="text-right">
                <p className="text-sm font-bold">{link.clicks || 0}</p>
                <p className="text-xs text-muted-foreground">clicks</p>
            </div>
            <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DialogTrigger asChild>
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem onClick={() => onDelete(link.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Link</DialogTitle>
                    </DialogHeader>
                    <LinkForm
                        onSubmit={handleUpdate}
                        onCancel={() => setEditOpen(false)}
                        initialData={link}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
};
