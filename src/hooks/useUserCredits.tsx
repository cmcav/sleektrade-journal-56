
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";

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
  const [isResetting, setIsResetting] = useState(false);
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
      } else if (data) {
        setCredits(data);
      } else {
        // No credits found, initialize them
        const newCredits = await initializeCredits();
        if (newCredits) {
          setCredits(newCredits);
        }
      }
    } catch (error) {
      console.error("Error in credits fetch:", error);
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Get next reset date (first day of next month)
  const getNextResetDate = () => {
    if (!credits) return null;
    
    const lastReset = new Date(credits.last_reset_date);
    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);
    return nextReset;
  };

  // Format the next reset date in a human-readable format
  const getNextResetFormatted = () => {
    const nextReset = getNextResetDate();
    if (!nextReset) return '';
    
    return formatDistance(nextReset, new Date(), { addSuffix: true });
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

  // Get credit usage percentage
  const getCreditUsagePercentage = () => {
    if (!credits || credits.total_credits === 0) return 0;
    return (credits.used_credits / credits.total_credits) * 100;
  };

  // Refresh credits data
  const refreshCredits = () => {
    fetchCredits();
  };

  // Initialize credits for new users
  const initializeCredits = async () => {
    if (!user) return null;
    
    try {
      console.log("Initializing credits for user:", user.id);
      
      // First check if credits already exist
      const { data: existingCredits, error: checkError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing credits:", checkError);
        return null;
      }
      
      // If credits already exist, return them
      if (existingCredits) {
        console.log("Credits already exist:", existingCredits);
        return existingCredits;
      }
      
      // Otherwise, create new credits
      const now = new Date().toISOString();
      const { data: newCredits, error: createError } = await supabase
        .from("user_credits")
        .insert({
          user_id: user.id,
          total_credits: 5, // Default starting credits
          used_credits: 0,
          last_reset_date: now
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating initial credits:", createError);
        toast({
          title: "Error",
          description: "Failed to initialize your credits. Please try again later.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log("New credits created:", newCredits);
      return newCredits;
    } catch (error) {
      console.error("Error in initialize credits:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred initializing your credits",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
    } else {
      setCredits(null);
      setIsLoading(false);
    }
  }, [user]);

  return {
    credits,
    isLoading,
    isResetting,
    hasEnoughCredits,
    getAvailableCredits,
    getCreditUsagePercentage,
    getNextResetFormatted,
    refreshCredits,
    initializeCredits
  };
}
