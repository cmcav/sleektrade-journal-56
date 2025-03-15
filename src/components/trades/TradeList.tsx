
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTradeData, Trade } from "@/hooks/useTradeData";
import { ArrowDownUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type SortField = "symbol" | "entryDate" | "pnl" | "strategy";
type SortOrder = "asc" | "desc";

interface TradeListProps {
  newTrade: Trade | null;
}

export function TradeList({ newTrade }: TradeListProps) {
  const { trades: fetchedTrades, deleteTrade, isLoading } = useTradeData();
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Update trades when data is fetched
  useEffect(() => {
    if (fetchedTrades) {
      setTrades(fetchedTrades);
    }
  }, [fetchedTrades]);
  
  // Update trades when a new trade is added
  useEffect(() => {
    if (newTrade && !trades.some(trade => trade.id === newTrade.id)) {
      setTrades(prevTrades => [newTrade, ...prevTrades]);
    }
  }, [newTrade, trades]);

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-border/30 rounded-lg">
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-20 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    switch (sortField) {
      case "symbol":
        return sortOrder === "asc"
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      case "entryDate":
        return sortOrder === "asc"
          ? new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
          : new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      case "pnl":
        return sortOrder === "asc" ? a.pnl - b.pnl : b.pnl - a.pnl;
      case "strategy":
        return sortOrder === "asc"
          ? a.strategy.localeCompare(b.strategy)
          : b.strategy.localeCompare(a.strategy);
      default:
        return 0;
    }
  });

  const handleDelete = (trade: Trade) => {
    deleteTrade(trade.id);
    // Update local state immediately to reflect the deletion
    setTrades(prevTrades => prevTrades.filter(t => t.id !== trade.id));
    toast({
      title: "Trade deleted",
      description: `${trade.symbol} trade has been removed from your journal`,
    });
  };

  const toggleTradeExpand = (id: string) => {
    setExpandedTradeId(expandedTradeId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent Trades</h3>
          <div className="flex gap-2 text-sm">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleSort("entryDate")}
            >
              Date
              <ArrowDownUp size={14} className={sortField === "entryDate" ? "text-primary" : ""} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleSort("symbol")}
            >
              Symbol
              <ArrowDownUp size={14} className={sortField === "symbol" ? "text-primary" : ""} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleSort("pnl")}
            >
              P&L
              <ArrowDownUp size={14} className={sortField === "pnl" ? "text-primary" : ""} />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {sortedTrades.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              No trades recorded yet. Add your first trade to get started!
            </motion.div>
          ) : (
            <motion.div
              layout
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {sortedTrades.map((trade) => (
                <motion.div
                  key={trade.id}
                  layoutId={trade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`p-4 rounded-lg border border-border/30 hover:border-border/50 transition-colors cursor-pointer ${
                    expandedTradeId === trade.id ? "glass" : "bg-background/50"
                  }`}
                  onClick={() => toggleTradeExpand(trade.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`text-sm font-semibold px-2.5 py-0.5 rounded ${
                          trade.type === "buy"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}
                      >
                        {trade.symbol}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(trade.entryDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className="font-normal"
                      >
                        {trade.strategy}
                      </Badge>
                      <span
                        className={`font-medium ${
                          trade.pnl > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTradeId === trade.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border/20 space-y-3 text-sm"
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <span className="text-muted-foreground">Entry:</span>{" "}
                            ${trade.entryPrice.toFixed(2)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exit:</span>{" "}
                            ${trade.exitPrice.toFixed(2)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quantity:</span>{" "}
                            {trade.quantity}
                          </div>
                          <div>
                            <span className="text-muted-foreground">P&L %:</span>{" "}
                            <span
                              className={
                                trade.pnlPercentage > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {trade.pnlPercentage > 0 ? "+" : ""}
                              {trade.pnlPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {trade.tags && trade.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {trade.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {trade.notes && (
                          <div className="pt-2">
                            <span className="text-muted-foreground block mb-1">Notes:</span>
                            <p className="text-foreground/90">{trade.notes}</p>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(trade);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
