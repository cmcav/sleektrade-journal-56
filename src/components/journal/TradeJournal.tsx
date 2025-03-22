
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalEntry, JournalEntry as JournalEntryType } from "./JournalEntry";
import { JournalList } from "./JournalList";
import { BookText } from "lucide-react";
import { sanitizeJournalText } from "@/utils/sanitization";

export function TradeJournal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"list" | "entry">("list");

  const handleEntryAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedEntry(null);
    setActiveTab("list");
  };

  const handleEntrySelected = (entry: JournalEntryType) => {
    // Sanitize the entry before storing it in state
    const sanitizedEntry: JournalEntryType = {
      ...entry,
      title: sanitizeJournalText(entry.title),
      content: sanitizeJournalText(entry.content)
    };
    
    setSelectedEntry(sanitizedEntry);
    setActiveTab("entry");
  };

  const handleEntryDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedEntry(null);
    setActiveTab("list");
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center mb-6">
        <BookText className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Trade Journal</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "list" | "entry")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list">Journal Entries</TabsTrigger>
            <TabsTrigger value="entry">
              {selectedEntry ? "Edit Entry" : "New Entry"}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-4">
          {activeTab === "list" ? (
            <JournalList 
              onSelectEntry={handleEntrySelected} 
              refreshTrigger={refreshTrigger} 
            />
          ) : (
            <JournalEntry 
              entry={selectedEntry || undefined} 
              onEntryAdded={handleEntryAdded}
              onDelete={handleEntryDeleted}
            />
          )}
        </div>
      </Tabs>
    </Card>
  );
}
