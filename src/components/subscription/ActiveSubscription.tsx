
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCreditInfo } from "./UserCreditInfo";
import { Subscription } from "@/hooks/useSubscription";

interface ActiveSubscriptionProps {
  subscription: Subscription;
  isCancelling: boolean;
  onCancelSubscription: () => Promise<void>;
}

export const ActiveSubscription: React.FC<ActiveSubscriptionProps> = ({
  subscription,
  isCancelling,
  onCancelSubscription
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Active Subscription</CardTitle>
          </div>
          <CardDescription>
            You currently have an active subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-1">Subscription Details</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your current subscription information
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium capitalize">{subscription.plan_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">${subscription.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="text-sm font-medium">Card ending in {subscription.card_last_four}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.subscription_date).toLocaleDateString()}
                  </span>
                </div>
                {subscription.next_billing_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next Billing</span>
                    <span className="text-sm font-medium">
                      {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <UserCreditInfo />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={onCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your subscription will remain active until the end of your current billing period.
        </AlertDescription>
      </Alert>
    </div>
  );
};
