
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionContext } from "./SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { ActiveSubscription } from "./ActiveSubscription";
import { SubscriptionSuccess } from "./SubscriptionSuccess";
import { SubscriptionTabs } from "./SubscriptionTabs";

const SubscriptionPage = () => {
  const { planType, setPlanType, discount, setDiscount, calculatePrice, isFreeSubscription } = useSubscriptionContext();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, cancelSubscription } = useSubscription();
  const [isCancelling, setIsCancelling] = useState(false);

  // Reset payment state when component mounts
  React.useEffect(() => {
    setPaymentSuccess(false);
  }, []);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setIsCancelling(true);
    try {
      const success = await cancelSubscription();
      if (success) {
        toast({
          title: "Subscription canceled",
          description: "Your subscription has been successfully canceled",
        });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Subscription</h1>
            <p className="text-muted-foreground mb-8">
              Upgrade your account to access premium features
            </p>

            {isLoadingSubscription ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : subscription && subscription.status === "active" ? (
              <ActiveSubscription 
                subscription={subscription}
                isCancelling={isCancelling}
                onCancelSubscription={handleCancelSubscription}
              />
            ) : paymentSuccess ? (
              <SubscriptionSuccess
                planType={planType}
                calculatePrice={calculatePrice}
                discount={discount}
                onBack={() => setPaymentSuccess(false)}
              />
            ) : (
              <SubscriptionTabs
                planType={planType}
                setPlanType={setPlanType}
                discount={discount}
                setDiscount={setDiscount}
                calculatePrice={calculatePrice}
                isFreeSubscription={isFreeSubscription}
                onPaymentSuccess={() => setPaymentSuccess(true)}
              />
            )}
          </div>
        </main>
      </PageTransition>
    </>
  );
};

export default SubscriptionPage;
