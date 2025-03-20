
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { JournalEntry as JournalEntryType } from "./JournalEntry";
import { FileText, BookText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface JournalListProps {
  onSelectEntry: (entry: JournalEntryType) => void;
  refreshTrigger?: number;
}

export function JournalList({ onSelectEntry, refreshTrigger = 0 }: JournalListProps) {
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEntries() {
      try {
        setIsLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          setEntries([]);
          return;
        }
        
        const { data, error } = await supabase
          .from("journal_entries")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setEntries(data || []);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEntries();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">No journal entries yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card 
          key={entry.id} 
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onSelectEntry(entry)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-medium line-clamp-1">{entry.title}</h3>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(entry.created_at), "MMM d, yyyy")}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {entry.content}
          </p>
        </Card>
      ))}
    </div>
  );
}
