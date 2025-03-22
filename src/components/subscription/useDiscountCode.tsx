
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

export const useDiscountCode = () => {
  const [discount, setDiscount] = useState<{
    code: string;
    percentage: number;
    valid: boolean;
  } | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const form = useForm();

  // Verify discount code
  const checkDiscountCode = async (code: string) => {
    if (!code.trim()) {
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
        setDiscount(null);
        form.setError("discountCode", { 
          type: "manual", 
          message: "Invalid or expired discount code" 
        });
      } else {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has expired" 
          });
          return;
        }
        
        // Check if max uses exceeded
        if (data.max_uses !== null && data.uses_count >= data.max_uses) {
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has reached maximum usage" 
          });
          return;
        }
        
        // Valid discount
        setDiscount({
          code: data.code,
          percentage: data.percentage,
          valid: true
        });
        
        form.clearErrors("discountCode");
      }
    } catch (error) {
      console.error("Error checking discount code:", error);
      setDiscount(null);
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  return { discount, isCheckingDiscount, checkDiscountCode };
};
