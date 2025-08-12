
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Link } from "@/lib/types";
import { MoreHorizontal, Pencil, Trash2, CalendarDays, ArrowUp, ArrowDown } from "lucide-react";
import LinkForm from "./link-form";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type LinkCardProps = {
  link: Link;
  index: number;
  totalLinks: number;
  onUpdate: (linkId: string, data: Partial<Link>) => void;
  onDelete: (linkId: string) => void;
  onMove: (linkId: string, direction: 'up' | 'down') => void;
};

const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return undefined;
}

export default function LinkCard({ link, index, totalLinks, onUpdate, onDelete, onMove }: LinkCardProps) {
    const [isEditOpen, setEditOpen] = useState(false);
    const [scheduleText, setScheduleText] = useState<string | null>(null);

    // Date formatting is now deferred to a useEffect hook, preventing hydration errors.
    useEffect(() => {
        try {
            const startDate = toDate(link.startDate);
            const endDate = toDate(link.endDate);
            let text: string | null = null;
            if (startDate || endDate) {
                // Use a consistent format that doesn't depend on server/client locale differences.
                const start = startDate ? format(startDate, "LLL d") : 'Always';
                const end = endDate ? format(endDate, "LLL d, yyyy") : 'Never';
                text = `${start} → ${end}`;
            }
            setScheduleText(text);
        } catch (e) {
            // In case of an invalid date string from Firestore
            setScheduleText("Invalid date range");
        }
    }, [link.startDate, link.endDate]);
  
    const handleFormSubmit = (title: string, url: string, startDate?: Date, endDate?: Date) => {
      onUpdate(link.id, { title, url, startDate, endDate });
      setEditOpen(false);
    };

    const handleToggleActive = (active: boolean) => {
        onUpdate(link.id, { active });
    }
    
    const truncatedUrl = link.url.length > 35 ? `${link.url.substring(0, 35)}...` : link.url;

    return (
        <Card className="flex items-center p-3 gap-3 sm:p-4 sm:gap-4">
            <div className="flex flex-col gap-2 items-center justify-center">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(link.id, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{index + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(link.id, 'down')} disabled={index === totalLinks - 1}>
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-grow overflow-hidden min-w-0">
                <p className="font-semibold truncate">{link.title}</p>
                <p className="text-sm text-muted-foreground truncate" title={link.url}>{truncatedUrl}</p>
                {scheduleText && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{scheduleText}</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                 <div className="flex-col items-center text-center hidden sm:flex">
                    <p className="text-sm font-bold">{link.clicks || 0}</p>
                    <p className="text-xs text-muted-foreground">clicks</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch id={`active-switch-${link.id}`} checked={link.active} onCheckedChange={handleToggleActive} />
                    <Label htmlFor={`active-switch-${link.id}`} className="text-sm sr-only sm:not-sr-only">
                        {link.active ? 'On' : 'Off'}
                    </Label>
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
                            onSubmit={handleFormSubmit}
                            onCancel={() => setEditOpen(false)}
                            initialData={link}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </Card>
    );
};
