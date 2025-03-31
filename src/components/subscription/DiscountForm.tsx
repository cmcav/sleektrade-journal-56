
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscountFormProps {
  discount: { code: string; percentage: number; valid: boolean } | null;
  setDiscount: (discount: { code: string; percentage: number; valid: boolean } | null) => void;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({ discount, setDiscount }) => {
  const [discountCode, setDiscountCode] = useState("");
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const { toast } = useToast();

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a discount code",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingDiscount(true);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.trim())
        .eq("is_active", true)
        .single();

      if (error) {
        throw new Error("Invalid discount code");
      }

      // Check if code is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error("This discount code has expired");
      }

      // Check if code has reached max uses
      if (data.max_uses !== null && data.uses_count >= data.max_uses) {
        throw new Error("This discount code has reached its maximum usage limit");
      }

      setDiscount({
        code: data.code,
        percentage: data.percentage,
        valid: true,
      });

      toast({
        title: "Discount applied",
        description: `${data.percentage}% discount has been applied to your subscription`,
      });
    } catch (error) {
      console.error("Error applying discount:", error);
      setDiscount(null);
      toast({
        title: "Invalid discount code",
        description: error instanceof Error ? error.message : "Failed to apply discount code",
        variant: "destructive",
      });
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Have a discount code?</CardTitle>
        <CardDescription>
          Enter your discount code to apply it to your subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Enter discount code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            disabled={isCheckingDiscount || (discount && discount.valid)}
          />
          <Button
            onClick={applyDiscount}
            disabled={isCheckingDiscount || (discount && discount.valid)}
          >
            {isCheckingDiscount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : discount && discount.valid ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Applied
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </div>
        {discount && discount.valid && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            {discount.percentage}% discount applied successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
