
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { useSubscriptionContext } from "./SubscriptionContext";

export const useDiscountCode = () => {
  const { setDiscount } = useSubscriptionContext();
  const [discount, setLocalDiscount] = useState<{
    code: string;
    percentage: number;
    valid: boolean;
  } | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [showCheckingMessage, setShowCheckingMessage] = useState(false);
  const form = useForm();

  // Show checking message only after a delay to prevent flickering
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCheckingDiscount) {
      timer = setTimeout(() => {
        setShowCheckingMessage(true);
      }, 600); // Only show the message if checking takes more than 600ms
    } else {
      setShowCheckingMessage(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isCheckingDiscount]);

  // Verify discount code
  const checkDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setLocalDiscount(null);
      setDiscount(null);
      return;
    }
    
    setIsCheckingDiscount(true);
    
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("code, percentage, is_active, max_uses, uses_count, expires_at")
        .eq("code", code.trim())
        .single();
      
      if (error || !data || !data.is_active) {
        console.log("Discount code error or not found:", error || "Code not found");
        setLocalDiscount(null);
        setDiscount(null);
        form.setError("discountCode", { 
          type: "manual", 
          message: "Invalid or expired discount code" 
        });
      } else {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setLocalDiscount(null);
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has expired" 
          });
          return;
        }
        
        // Check if max uses exceeded
        if (data.max_uses !== null && data.uses_count >= data.max_uses) {
          setLocalDiscount(null);
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has reached maximum usage" 
          });
          return;
        }
        
        // Valid discount
        const validDiscount = {
          code: data.code,
          percentage: data.percentage,
          valid: true
        };
        
        setLocalDiscount(validDiscount);
        setDiscount(validDiscount); // Update the context
        
        form.clearErrors("discountCode");
      }
    } catch (error) {
      console.error("Error checking discount code:", error);
      setLocalDiscount(null);
      setDiscount(null);
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  return { discount, isCheckingDiscount, showCheckingMessage, checkDiscountCode };
};
