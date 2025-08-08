
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Link } from "@/lib/types";
import { GripVertical, MoreHorizontal, Pencil, Trash2, CalendarDays } from "lucide-react";
import LinkForm from "./link-form";
import { useState, useRef } from "react";
import { useDrag, useDrop, XYCoord } from 'react-dnd';
import { format } from 'date-fns';
import { Timestamp } from "firebase/firestore";

type LinkCardProps = {
  link: Link;
  index: number;
  onUpdate: (linkId: string, title: string, url: string, startDate?: Date, endDate?: Date) => void;
  onDelete: (linkId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDrop: () => void;
};

const ItemTypes = {
  LINK: 'link',
};

// Helper to convert Timestamp to Date if needed
const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    return undefined;
}


export default function LinkCard({ link, index, onUpdate, onDelete, onMove, onDrop }: LinkCardProps) {
    const [isEditOpen, setEditOpen] = useState(false);
    
    const ref = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
      accept: ItemTypes.LINK,
      hover(item: { id: string; index: number }, monitor) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex === hoverIndex) {
          return;
        }

        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
        
        onMove(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });
  
    const [{ isDragging }, drag, preview] = useDrag({
      type: ItemTypes.LINK,
      item: () => ({ id: link.id, index }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: () => {
        onDrop();
      },
    });
  
    // Initialize DND references
    preview(drop(ref));
  
    const handleUpdate = (title: string, url: string, startDate?: Date, endDate?: Date) => {
      onUpdate(link.id, title, url, startDate, endDate);
      setEditOpen(false);
    };

    const hasSchedule = link.startDate || link.endDate;
    const startDate = toDate(link.startDate);
    const endDate = toDate(link.endDate);

    return (
        <Card ref={ref} className="flex items-center p-3 gap-3" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <div ref={drag} className="cursor-move p-1">
                <GripVertical className="text-muted-foreground" />
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
