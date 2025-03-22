
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Save, Trash } from "lucide-react";
import { format } from "date-fns";
import { sanitizeJournalText } from "@/utils/sanitization";

// Journal entry schema with max length validation
const journalEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  content: z.string().min(1, "Entry content is required").max(10000, "Entry content must be less than 10000 characters"),
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface JournalEntryProps {
  onEntryAdded?: () => void;
  entry?: JournalEntry;
  onDelete?: (id: string) => void;
}

export function JournalEntry({ onEntryAdded, entry, onDelete }: JournalEntryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!entry;

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      title: entry?.title || "",
      content: entry?.content || "",
    },
  });

  async function onSubmit(data: JournalEntryFormValues) {
    try {
      setIsSubmitting(true);
      
      // Sanitize input data to prevent XSS
      const sanitizedTitle = sanitizeJournalText(data.title, 100);
      const sanitizedContent = sanitizeJournalText(data.content, 10000);
      
      // Check for user authentication
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save journal entries",
          variant: "destructive",
        });
        return;
      }

      if (isEditing) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            title: sanitizedTitle,
            content: sanitizedContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (error) throw error;

        toast({
          title: "Entry updated",
          description: "Your journal entry has been updated",
        });
      } else {
        // Insert new entry
        const { error } = await supabase.from("journal_entries").insert({
          user_id: userData.user.id,
          title: sanitizedTitle,
          content: sanitizedContent,
        });

        if (error) throw error;

        // Reset form after successful submission
        form.reset({
          title: "",
          content: "",
        });

        toast({
          title: "Entry saved",
          description: "Your journal entry has been saved",
        });
      }

      if (onEntryAdded) {
        onEntryAdded();
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to save your journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!entry?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entry.id);
      
      if (error) throw error;
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted",
      });
      
      if (onDelete) {
        onDelete(entry.id);
      }
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete your journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center mb-4">
        <FileText className="mr-2 h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">
          {isEditing ? "Edit Journal Entry" : "New Journal Entry"}
        </h3>
        {isEditing && (
          <div className="ml-auto">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : <Trash className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
      
      {isEditing && (
        <div className="text-sm text-muted-foreground mb-4">
          Created: {format(new Date(entry.created_at), "PPP p")}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Entry title" 
                    {...field} 
                    maxLength={100}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Journal Entry</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Write your thoughts about your trading..." 
                    className="min-h-[200px]" 
                    {...field} 
                    maxLength={10000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update Entry" : "Save Entry"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
