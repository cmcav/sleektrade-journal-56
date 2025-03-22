
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscriptionContext } from "./SubscriptionContext";

export const SubscriptionSummary = () => {
  const { planType, setPlanType, calculatePrice, discount } = useSubscriptionContext();

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
              onClick={() => setPlanType("monthly")}
            >
              Monthly
            </Button>
            <Button 
              variant={planType === "yearly" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPlanType("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Base Plan</span>
            <span>${planType === "monthly" ? "9.99" : "95.90"} {planType === "monthly" ? "/mo" : "/year"}</span>
          </div>
          
          {planType === "yearly" && (
            <div className="flex justify-between text-primary">
              <span>Annual discount (20%)</span>
              <span>-$23.98</span>
            </div>
          )}
          
          {discount && discount.valid && (
            <div className="flex justify-between text-green-600 pt-2">
              <span>Discount ({discount.percentage}%)</span>
              <span>
                -${(planType === "monthly" ? 9.99 : 95.90) * discount.percentage / 100}
              </span>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${calculatePrice()}</span>
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
