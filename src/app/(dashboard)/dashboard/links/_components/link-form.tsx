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

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type LinkFormProps = {
  onSubmit: (title: string, url: string, startDate?: Date, endDate?: Date) => void;
  onCancel: () => void;
  initialData?: Link;
};

export default function LinkForm({ onSubmit, onCancel, initialData }: LinkFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      url: initialData?.url || "",
      startDate: initialData?.startDate ? initialData.startDate.toDate() : undefined,
      endDate: initialData?.endDate ? initialData.endDate.toDate() : undefined,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    await onSubmit(values.title, values.url, values.startDate, values.endDate);
    setLoading(false);
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
                <Input placeholder="My Awesome Website" {...field} />
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
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    />
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>


        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
