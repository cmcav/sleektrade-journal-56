
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIStrategy {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  riskLevel: number;
  content: string;
  createdAt: string;
}

export function useAIStrategies() {
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load strategies from Supabase when user changes
  useEffect(() => {
    const fetchStrategies = async () => {
      if (!user) {
        // If no user is logged in, try to load from localStorage as fallback
        const savedStrategies = localStorage.getItem("ai-strategies");
        if (savedStrategies) {
          try {
            setStrategies(JSON.parse(savedStrategies));
          } catch (error) {
            console.error("Error loading strategies from localStorage:", error);
          }
        }
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ai_strategies")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Transform database schema to match our interface
        const formattedStrategies = data.map((strategy) => ({
          id: strategy.id,
          name: strategy.name,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          riskLevel: strategy.risk_level,
          content: strategy.content,
          createdAt: strategy.created_at,
        }));

        setStrategies(formattedStrategies);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        toast({
          title: "Failed to load strategies",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrategies();
  }, [user, toast]);

  // Save strategies to localStorage as fallback when they change
  useEffect(() => {
    localStorage.setItem("ai-strategies", JSON.stringify(strategies));
  }, [strategies]);

  const addStrategy = async (strategy: AIStrategy) => {
    // Add to local state first for immediate UI update
    setStrategies(prev => [strategy, ...prev]);

    if (!user) {
      // If no user is logged in, just update localStorage (already done in the effect)
      return;
    }

    try {
      // Then persist to database
      const { error } = await supabase.from("ai_strategies").insert({
        id: strategy.id,
        user_id: user.id,
        name: strategy.name,
        symbol: strategy.symbol,
        timeframe: strategy.timeframe,
        risk_level: strategy.riskLevel,
        content: strategy.content,
        created_at: strategy.createdAt,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        title: "Failed to save strategy",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      
      // Remove from local state if save failed
      setStrategies(prev => prev.filter(s => s.id !== strategy.id));
    }
  };

  const removeStrategy = async (id: string) => {
    // Remove from local state first for immediate UI update
    setStrategies(prev => prev.filter(strategy => strategy.id !== id));

    if (!user) {
      // If no user is logged in, just update localStorage (already done in the effect)
      return;
    }

    try {
      // Then remove from database
      const { error } = await supabase
        .from("ai_strategies")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Failed to delete strategy",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      
      // Fetch strategies again to restore state if delete failed
      const { data } = await supabase
        .from("ai_strategies")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (data) {
        const formattedStrategies = data.map((strategy) => ({
          id: strategy.id,
          name: strategy.name,
          symbol: strategy.symbol,
          timeframe: strategy.timeframe,
          riskLevel: strategy.risk_level,
          content: strategy.content,
          createdAt: strategy.created_at,
        }));
        
        setStrategies(formattedStrategies);
      }
    }
  };

  const updateStrategy = async (updatedStrategy: AIStrategy) => {
    // Update local state first for immediate UI update
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === updatedStrategy.id ? updatedStrategy : strategy
      )
    );

    if (!user) {
      // If no user is logged in, just update localStorage (already done in the effect)
      return;
    }

    try {
      // Then update in database
      const { error } = await supabase
        .from("ai_strategies")
        .update({
          name: updatedStrategy.name,
          symbol: updatedStrategy.symbol,
          timeframe: updatedStrategy.timeframe,
          risk_level: updatedStrategy.riskLevel,
          content: updatedStrategy.content,
        })
        .eq("id", updatedStrategy.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({
        title: "Failed to update strategy",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    strategies,
    isLoading,
    addStrategy,
    removeStrategy,
    updateStrategy
  };
}
