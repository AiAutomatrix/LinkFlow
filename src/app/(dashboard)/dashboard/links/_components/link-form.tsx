
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Link } from "@/lib/types";
import { DatePicker } from "@/components/ui/datepicker";
import { Timestamp } from "firebase/firestore";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  url: z.preprocess(
      (arg) => {
        if (typeof arg === "string" && arg.trim().length > 0 && !/^(https?):\/\//i.test(arg)) {
          return `https://${arg}`;
        }
        return arg;
      },
      z.string().url({ message: "Please enter a valid URL." })
  ),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
    }
    return true;
}, {
    message: "End date must be after start date.",
    path: ["endDate"],
});

type LinkFormProps = {
  onSubmit: (title: string, url: string, startDate?: Date, endDate?: Date) => void;
  onCancel: () => void;
  initialData?: Partial<Link>;
  isSocial?: boolean;
};

// Helper to convert Timestamp to Date if needed
const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return undefined;
}


export default function LinkForm({ onSubmit, onCancel, initialData, isSocial = false }: LinkFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      url: initialData?.url || "",
      startDate: toDate(initialData?.startDate),
      endDate: toDate(initialData?.endDate),
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      onSubmit(values.title, values.url, values.startDate, values.endDate);
    } catch (e) {
      // Error will be handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Website" {...field} disabled={isSocial} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} disabled={isSocial} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isSocial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <DatePicker 
                            date={field.value} 
                            setDate={field.onChange}
                            placeholder="Link is active immediately"
                        />
                        <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <DatePicker 
                            date={field.value}
                            setDate={field.onChange}
                            placeholder="Link never expires"
                            disabled={(date) => {
                                const startDate = form.getValues("startDate");
                                return startDate ? date < startDate : false;
                            }}
                        />
                        <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        )}


        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || isSocial}>
            {loading ? "Saving..." : "Save"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
