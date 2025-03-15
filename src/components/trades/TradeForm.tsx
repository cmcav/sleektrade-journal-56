
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTradeData } from "@/hooks/useTradeData";
import { motion } from "framer-motion";

export function TradeForm() {
  const { addTrade } = useTradeData();
  const { toast } = useToast();

  const [symbol, setSymbol] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [strategy, setStrategy] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!symbol || !entryPrice || !exitPrice || !quantity || !strategy) {
        throw new Error("Please fill in all required fields");
      }

      const newTrade = addTrade({
        symbol: symbol.toUpperCase(),
        entryPrice: parseFloat(entryPrice),
        exitPrice: parseFloat(exitPrice),
        entryDate: new Date().toISOString(),
        exitDate: new Date().toISOString(),
        quantity: parseInt(quantity),
        type,
        strategy,
        tags: tags.split(",").map((tag) => tag.trim()),
        notes,
      });

      toast({
        title: "Trade added",
        description: `Successfully added ${newTrade.symbol} trade with ${newTrade.pnl > 0 ? "profit" : "loss"} of $${Math.abs(newTrade.pnl).toFixed(2)}`,
        variant: newTrade.pnl > 0 ? "default" : "destructive",
      });

      // Reset form
      setSymbol("");
      setEntryPrice("");
      setExitPrice("");
      setQuantity("");
      setType("buy");
      setStrategy("");
      setTags("");
      setNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add trade",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFields = [
    {
      id: "symbol",
      label: "Symbol",
      value: symbol,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSymbol(e.target.value),
      placeholder: "e.g. AAPL",
      type: "text",
      required: true,
    },
    {
      id: "entryPrice",
      label: "Entry Price",
      value: entryPrice,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEntryPrice(e.target.value),
      placeholder: "e.g. 150.50",
      type: "number",
      required: true,
    },
    {
      id: "exitPrice",
      label: "Exit Price",
      value: exitPrice,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setExitPrice(e.target.value),
      placeholder: "e.g. 155.75",
      type: "number",
      required: true,
    },
    {
      id: "quantity",
      label: "Quantity",
      value: quantity,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value),
      placeholder: "e.g. 10",
      type: "number",
      required: true,
    },
  ];

  const strategyOptions = [
    "Day Trade", 
    "Swing", 
    "Position", 
    "Scalping", 
    "Momentum", 
    "Breakout", 
    "Reversal",
    "Other"
  ];

  return (
    <Card className="glass-card">
      <motion.form 
        onSubmit={handleSubmit}
        className="p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Add New Trade</h3>
          <p className="text-sm text-muted-foreground">
            Record your trade details for tracking and analysis
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {formFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                value={field.value}
                onChange={field.onChange}
                placeholder={field.placeholder}
                type={field.type}
                required={field.required}
                className="bg-background/50"
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="type">Trade Type</Label>
            <Select value={type} onValueChange={(value: "buy" | "sell") => setType(value)}>
              <SelectTrigger id="type" className="bg-background/50">
                <SelectValue placeholder="Select trade type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy (Long)</SelectItem>
                <SelectItem value="sell">Sell (Short)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger id="strategy" className="bg-background/50">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. tech, breakout, momentum"
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your trade notes, observations, or reasons..."
            className="min-h-[100px] bg-background/50"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Trade..." : "Add Trade"}
        </Button>
      </motion.form>
    </Card>
  );
}
