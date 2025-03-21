
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  amount: number;
  card_last_four: string;
  subscription_date: string;
  next_billing_date: string | null;
  canceled_at: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (error) {
          console.error("Error fetching subscription:", error);
          // If error is not "No rows found", show error toast
          if (error.code !== "PGRST116") {
            toast({
              title: "Error",
              description: "Failed to fetch subscription information",
              variant: "destructive",
            });
          }
          setSubscription(null);
        } else {
          setSubscription(data as Subscription);
        }
      } catch (error) {
        console.error("Error in subscription fetch:", error);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const cancelSubscription = async () => {
    if (!user || !subscription) return false;

    try {
      // First, update the local subscription record
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ 
          status: "canceled", 
          canceled_at: new Date().toISOString() 
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      // Call the edge function to handle any external cancellation if needed
      // This could be added later if an actual payment processor integration is needed

      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been successfully canceled",
      });

      // Update the local state
      setSubscription(prev => 
        prev ? { ...prev, status: "canceled", canceled_at: new Date().toISOString() } : null
      );
      
      return true;
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    subscription,
    isLoading,
    isSubscribed: !!subscription && subscription.status === "active",
    cancelSubscription,
  };
};
