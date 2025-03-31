
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { DiscountForm } from "./DiscountForm";
import { PaymentForm } from "./PaymentForm";

interface SubscriptionTabsProps {
  planType: "monthly" | "yearly";
  setPlanType: (type: "monthly" | "yearly") => void;
  discount: { code: string; percentage: number; valid: boolean } | null;
  setDiscount: (discount: { code: string; percentage: number; valid: boolean } | null) => void;
  calculatePrice: () => string;
  isFreeSubscription: boolean;
  onPaymentSuccess: () => void;
}

export const SubscriptionTabs: React.FC<SubscriptionTabsProps> = ({
  planType,
  setPlanType,
  discount,
  setDiscount,
  calculatePrice,
  isFreeSubscription,
  onPaymentSuccess
}) => {
  // Function to navigate back to plans tab
  const navigateToPlansTab = () => {
    const plansTab = document.querySelector('[data-value="plans"]') as HTMLElement;
    if (plansTab) {
      plansTab.click();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="payment">Payment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlans
            planType={planType}
            setPlanType={setPlanType}
            discount={discount}
          />
          
          <DiscountForm
            discount={discount}
            setDiscount={setDiscount}
          />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentForm
            planType={planType}
            discount={discount}
            calculatePrice={calculatePrice}
            isFreeSubscription={isFreeSubscription}
            onBack={navigateToPlansTab}
            onSuccess={onPaymentSuccess}
          />
        </TabsContent>
      </Tabs>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your subscription will automatically renew at the end of your billing period.
          You can cancel anytime from your account settings.
        </AlertDescription>
      </Alert>
    </div>
  );
};
