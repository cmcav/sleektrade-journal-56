
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscriptionContext } from "./SubscriptionContext";
import { sanitizeInput } from "@/utils/sanitization";

export const SubscriptionSummary = () => {
  const { planType, setPlanType, calculatePrice, discount, isFreeSubscription } = useSubscriptionContext();
  
  // Base prices without discounts
  const baseMonthlyPrice = 100.00;
  const yearlyDiscount = 0.20; // 20% discount
  const baseYearlyTotal = baseMonthlyPrice * 12 * (1 - yearlyDiscount);
  const yearlySavings = baseMonthlyPrice * 12 - baseYearlyTotal;
  
  const currentBasePrice = planType === "monthly" ? baseMonthlyPrice : baseYearlyTotal;

  // Sanitize plan type to prevent XSS if it comes from URL parameters 
  // or external sources in the future
  const handlePlanChange = (plan: string) => {
    const sanitizedPlan = sanitizeInput(plan);
    if (sanitizedPlan === "monthly" || sanitizedPlan === "yearly") {
      setPlanType(sanitizedPlan as "monthly" | "yearly");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>SleekTrade Pro Subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <p className="font-medium">Select Plan</p>
            <p className="text-sm text-muted-foreground">Choose billing frequency</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={planType === "monthly" ? "default" : "outline"} 
              size="sm"
              onClick={() => handlePlanChange("monthly")}
            >
              Monthly
            </Button>
            <Button 
              variant={planType === "yearly" ? "default" : "outline"} 
              size="sm"
              onClick={() => handlePlanChange("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Base Plan</span>
            <span>${planType === "monthly" ? baseMonthlyPrice.toFixed(2) : (baseMonthlyPrice * 12).toFixed(2)} {planType === "monthly" ? "/mo" : "/year"}</span>
          </div>
          
          {planType === "yearly" && (
            <div className="flex justify-between text-primary">
              <span>Annual discount (20%)</span>
              <span>-${yearlySavings.toFixed(2)}</span>
            </div>
          )}
          
          {discount && discount.valid && (
            <div className="flex justify-between text-green-600 pt-2">
              <span>Discount ({discount.percentage}%)</span>
              <span>
                -${((currentBasePrice * discount.percentage) / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            {isFreeSubscription ? (
              <div className="flex flex-col items-end">
                <span className="line-through text-gray-400 text-sm">${currentBasePrice.toFixed(2)}</span>
                <span className="text-green-600">FREE</span>
              </div>
            ) : (
              <span>${calculatePrice()}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {planType === "monthly" ? "Billed monthly" : "Billed annually"}
          </p>
        </div>
        
        <div className="rounded-lg bg-primary/5 p-4 text-sm">
          <p className="font-medium mb-2">What's included:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary mr-2 mt-1" />
              <span>Unlimited trade tracking</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary mr-2 mt-1" />
              <span>Advanced analytics and reports</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary mr-2 mt-1" />
              <span>AI-powered trading strategies</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary mr-2 mt-1" />
              <span>Priority customer support</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
