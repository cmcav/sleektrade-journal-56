
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: string;
  exitDate: string;
  quantity: number;
  type: "buy" | "sell";
  strategy: string;
  tags: string[];
  pnl: number;
  pnlPercentage: number;
  notes?: string;
}

export function useTradeData() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load trade data from Supabase
  useEffect(() => {
    const loadTradeData = async () => {
      if (!user) {
        // Use sample data if user is not logged in
        loadSampleData();
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .order('entry_date', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform from database format to front-end format
        const formattedTrades: Trade[] = data.map(trade => ({
          id: trade.id,
          symbol: trade.symbol,
          entryPrice: Number(trade.entry_price),
          exitPrice: trade.exit_price ? Number(trade.exit_price) : 0,
          entryDate: trade.entry_date,
          exitDate: trade.exit_date || "",
          quantity: Number(trade.quantity),
          type: trade.type as "buy" | "sell",
          strategy: trade.strategy || "",
          tags: trade.tags || [],
          pnl: trade.pnl ? Number(trade.pnl) : 0,
          pnlPercentage: trade.pnl_percentage ? Number(trade.pnl_percentage) : 0,
          notes: trade.notes,
        }));

        setTrades(formattedTrades);
        setError(null);
      } catch (err: any) {
        console.error("Error loading trade data:", err);
        setError("Failed to load trade data. Please try again.");
        // Fallback to sample data
        loadSampleData();
      } finally {
        setIsLoading(false);
      }
    };

    loadTradeData();
  }, [user]);

  // Load sample data for non-authenticated users or error fallback
  const loadSampleData = () => {
    setIsLoading(true);

    try {
      // Sample data - in a real app this would come from an API or local storage
      const sampleTrades: Trade[] = [
        {
          id: "1",
          symbol: "AAPL",
          entryPrice: 150.25,
          exitPrice: 155.75,
          entryDate: "2023-09-15T10:30:00Z",
          exitDate: "2023-09-17T14:45:00Z",
          quantity: 10,
          type: "buy",
          strategy: "Swing",
          tags: ["tech", "momentum"],
          pnl: 55,
          pnlPercentage: 3.66,
          notes: "Earnings beat expectations, caught the upward momentum."
        },
        {
          id: "2",
          symbol: "TSLA",
          entryPrice: 220.50,
          exitPrice: 210.25,
          entryDate: "2023-09-20T09:15:00Z",
          exitDate: "2023-09-20T15:30:00Z",
          quantity: 5,
          type: "buy",
          strategy: "Day Trade",
          tags: ["tech", "volatile"],
          pnl: -51.25,
          pnlPercentage: -4.65,
          notes: "Unexpected market news caused a quick reversal."
        },
        {
          id: "3",
          symbol: "MSFT",
          entryPrice: 320.75,
          exitPrice: 330.50,
          entryDate: "2023-09-22T11:00:00Z",
          exitDate: "2023-09-24T10:15:00Z",
          quantity: 8,
          type: "buy",
          strategy: "Swing",
          tags: ["tech", "breakout"],
          pnl: 78,
          pnlPercentage: 3.04,
          notes: "Broke out of consolidation pattern on high volume."
        },
        {
          id: "4",
          symbol: "AMZN",
          entryPrice: 135.20,
          exitPrice: 140.75,
          entryDate: "2023-09-25T09:30:00Z",
          exitDate: "2023-09-30T15:45:00Z",
          quantity: 15,
          type: "buy",
          strategy: "Position",
          tags: ["tech", "ecommerce", "uptrend"],
          pnl: 83.25,
          pnlPercentage: 4.10,
          notes: "Strong holiday season forecast and new product announcements."
        },
        {
          id: "5",
          symbol: "SPY",
          entryPrice: 440.50,
          exitPrice: 436.25,
          entryDate: "2023-10-02T10:00:00Z",
          exitDate: "2023-10-02T16:00:00Z",
          quantity: 10,
          type: "sell",
          strategy: "Day Trade",
          tags: ["etf", "market-wide"],
          pnl: 42.5,
          pnlPercentage: 0.97,
          notes: "Short position on market weakness ahead of economic data."
        },
      ];

      setTrades(sampleTrades);
      setError(null);
    } catch (err) {
      console.error("Error loading sample trade data:", err);
      setError("Failed to load trade data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addTrade = async (trade: Omit<Trade, "id" | "pnl" | "pnlPercentage">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add trades",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Calculate PnL values
      const pnl = calculatePnl(trade);
      const pnlPercentage = calculatePnlPercentage(trade);

      // Format for database
      const dbTrade = {
        user_id: user.id,
        symbol: trade.symbol,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        entry_date: trade.entryDate,
        exit_date: trade.exitDate || null,
        quantity: trade.quantity,
        type: trade.type,
        strategy: trade.strategy,
        tags: trade.tags,
        pnl: pnl,
        pnl_percentage: pnlPercentage,
        notes: trade.notes,
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(dbTrade)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Format response for client
      const newTrade: Trade = {
        id: data.id,
        symbol: data.symbol,
        entryPrice: Number(data.entry_price),
        exitPrice: data.exit_price ? Number(data.exit_price) : 0,
        entryDate: data.entry_date,
        exitDate: data.exit_date || "",
        quantity: Number(data.quantity),
        type: data.type,
        strategy: data.strategy || "",
        tags: data.tags || [],
        pnl: Number(data.pnl),
        pnlPercentage: Number(data.pnl_percentage),
        notes: data.notes,
      };

      setTrades(prevTrades => [newTrade, ...prevTrades]);
      return newTrade;
    } catch (error: any) {
      toast({
        title: "Error adding trade",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error adding trade:", error);
      return null;
    }
  };

  const updateTrade = async (updatedTrade: Trade) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update trades",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format for database
      const dbTrade = {
        symbol: updatedTrade.symbol,
        entry_price: updatedTrade.entryPrice,
        exit_price: updatedTrade.exitPrice,
        entry_date: updatedTrade.entryDate,
        exit_date: updatedTrade.exitDate || null,
        quantity: updatedTrade.quantity,
        type: updatedTrade.type,
        strategy: updatedTrade.strategy,
        tags: updatedTrade.tags,
        pnl: updatedTrade.pnl,
        pnl_percentage: updatedTrade.pnlPercentage,
        notes: updatedTrade.notes,
      };

      const { error } = await supabase
        .from('trades')
        .update(dbTrade)
        .eq('id', updatedTrade.id);

      if (error) {
        throw error;
      }

      setTrades(prevTrades =>
        prevTrades.map(trade =>
          trade.id === updatedTrade.id ? updatedTrade : trade
        )
      );
    } catch (error: any) {
      toast({
        title: "Error updating trade",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error updating trade:", error);
    }
  };

  const deleteTrade = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete trades",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTrades(prevTrades => prevTrades.filter(trade => trade.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting trade",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error deleting trade:", error);
    }
  };

  // Helper functions for calculations
  const calculatePnl = (trade: Omit<Trade, "id" | "pnl" | "pnlPercentage">) => {
    const { entryPrice, exitPrice, quantity, type } = trade;
    if (type === "buy") {
      return (exitPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - exitPrice) * quantity;
    }
  };

  const calculatePnlPercentage = (trade: Omit<Trade, "id" | "pnl" | "pnlPercentage">) => {
    const { entryPrice, exitPrice, type } = trade;
    if (type === "buy") {
      return ((exitPrice - entryPrice) / entryPrice) * 100;
    } else {
      return ((entryPrice - exitPrice) / entryPrice) * 100;
    }
  };

  // Analytics helpers
  const getTotalPnl = () => {
    return trades.reduce((total, trade) => total + trade.pnl, 0);
  };

  const getWinRate = () => {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter((trade) => trade.pnl > 0);
    return (winningTrades.length / trades.length) * 100;
  };

  const getAveragePnl = () => {
    if (trades.length === 0) return 0;
    return getTotalPnl() / trades.length;
  };

  return {
    trades,
    isLoading,
    error,
    addTrade,
    updateTrade,
    deleteTrade,
    analytics: {
      totalPnl: getTotalPnl(),
      winRate: getWinRate(),
      averagePnl: getAveragePnl(),
      totalTrades: trades.length,
    },
  };
}
