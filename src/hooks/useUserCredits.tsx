
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserCredits {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export function useUserCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching credits:", error);
        toast({
          title: "Error",
          description: "Failed to fetch credit information",
          variant: "destructive",
        });
        setCredits(null);
      } else {
        setCredits(data);
      }
    } catch (error) {
      console.error("Error in credits fetch:", error);
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has enough credits to generate a strategy
  const hasEnoughCredits = () => {
    if (!credits) return false;
    return credits.used_credits < credits.total_credits;
  };

  // Get available credits
  const getAvailableCredits = () => {
    if (!credits) return 0;
    return Math.max(0, credits.total_credits - credits.used_credits);
  };

  // Refresh credits data
  const refreshCredits = () => {
    fetchCredits();
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return {
    credits,
    isLoading,
    hasEnoughCredits,
    getAvailableCredits,
    refreshCredits,
  };
}
