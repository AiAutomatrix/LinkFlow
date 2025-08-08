"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Link } from "@/lib/types";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import LinkForm from "./link-form";
import { useState } from "react";
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

type LinkCardProps = {
  link: Link;
  onUpdate: (linkId: string, title: string, url: string) => void;
  onDelete: (linkId: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
};

const ItemTypes = {
  LINK: 'link',
};

const DraggableLinkCard = ({ link, onUpdate, onDelete, onReorder }: LinkCardProps) => {
    const [isEditOpen, setEditOpen] = useState(false);
    
    const ref = React.useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
      accept: ItemTypes.LINK,
      hover(item: { id: string }) {
        if (!ref.current || item.id === link.id) {
          return;
        }
        onReorder(item.id, link.id);
      },
    });
  
    const [{ isDragging }, drag, preview] = useDrag({
      type: ItemTypes.LINK,
      item: { id: link.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
  
    drag(drop(ref));
  
    const handleUpdate = (title: string, url: string) => {
      onUpdate(link.id, title, url);
      setEditOpen(false);
    };

    return (
        <div ref={preview} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <Card ref={ref} className="flex items-center p-3 gap-3">
                <div ref={drag} className="cursor-move p-1">
                    <GripVertical className="text-muted-foreground" />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-sm text-muted-foreground">{link.url}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{link.clicks} clicks</p>
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
        </div>
    );
};

export default function LinkCard(props: LinkCardProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DraggableLinkCard {...props} />
    </DndProvider>
  )
}
