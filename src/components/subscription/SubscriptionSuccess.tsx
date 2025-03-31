
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface SubscriptionSuccessProps {
  planType: "monthly" | "yearly";
  calculatePrice: () => string;
  discount: { code: string; percentage: number; valid: boolean } | null;
  onBack: () => void;
}

export const SubscriptionSuccess: React.FC<SubscriptionSuccessProps> = ({
  planType,
  calculatePrice,
  discount,
  onBack
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <CardTitle>Subscription Successful</CardTitle>
        </div>
        <CardDescription>
          Thank you for subscribing to our premium plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Your subscription has been successfully processed. You now have access to all premium features.
        </p>
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-2">Subscription Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium capitalize">{planType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">${calculatePrice()}</span>
            </div>
            {discount && discount.valid && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Discount Applied</span>
                <span className="text-sm font-medium">{discount.percentage}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Subscription
        </Button>
        <Button onClick={() => window.location.href = "/dashboard"}>
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
};
