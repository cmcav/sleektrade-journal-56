
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface SubscriptionPlansProps {
  planType: "monthly" | "yearly";
  setPlanType: (type: "monthly" | "yearly") => void;
  discount: { code: string; percentage: number; valid: boolean } | null;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  planType,
  setPlanType,
  discount,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className={`flex flex-col ${planType === "monthly" ? "border-primary" : ""}`}>
        <CardHeader>
          <CardTitle>Monthly Plan</CardTitle>
          <CardDescription>
            Billed monthly, cancel anytime
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="text-3xl font-bold">
            ${discount && discount.valid
              ? ((9.99 * (100 - discount.percentage)) / 100).toFixed(2)
              : "9.99"}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">30 AI strategy generations per month</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Advanced analytics</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Priority support</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">No ads</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button
            className="w-full"
            variant={planType === "monthly" ? "default" : "outline"}
            onClick={() => setPlanType("monthly")}
          >
            {planType === "monthly" ? "Selected" : "Select Plan"}
          </Button>
        </CardFooter>
      </Card>

      <Card className={`flex flex-col ${planType === "yearly" ? "border-primary" : ""}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Yearly Plan</CardTitle>
              <CardDescription>
                Billed annually, save 20%
              </CardDescription>
            </div>
            <div className="bg-primary/20 text-primary text-xs font-medium px-2 py-1 rounded-full">
              Save 20%
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="text-3xl font-bold">
            ${discount && discount.valid
              ? ((96.00 * (100 - discount.percentage)) / 100).toFixed(2)
              : "96.00"}
            <span className="text-sm font-normal text-muted-foreground">
              /year
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Equivalent to $8.00/month
          </div>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">30 AI strategy generations per month</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Advanced analytics</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Priority support</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">No ads</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">2 months free</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button
            className="w-full"
            variant={planType === "yearly" ? "default" : "outline"}
            onClick={() => setPlanType("yearly")}
          >
            {planType === "yearly" ? "Selected" : "Select Plan"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
