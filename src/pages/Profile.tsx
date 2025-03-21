
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { user } = useAuth();
  const { subscription, isSubscribed, cancelSubscription, isLoading } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      setIsCanceling(true);
      const success = await cancelSubscription();
      setIsCanceling(false);
      
      if (success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto pt-20 px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground mb-8">Manage your account settings and subscription</p>
        </motion.div>

        <div className="grid gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account ID</p>
                  <p className="text-sm font-mono">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account Created</p>
                  <p>{user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your SleekTrade Pro subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : isSubscribed ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Active Subscription</span>
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Plan</p>
                        <p className="font-medium">{subscription?.plan_type === 'monthly' ? 'Monthly' : 'Annual'} Plan</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Price</p>
                        <p>${subscription?.amount.toFixed(2)} {subscription?.plan_type === 'monthly' ? 'per month' : 'per year'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Payment Method</p>
                        <p className="flex items-center"><CreditCard className="mr-2 h-4 w-4" /> Card ending in {subscription?.card_last_four}</p>
                      </div>
                      {subscription?.subscription_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Subscribed On</p>
                          <p>{format(new Date(subscription.subscription_date), 'PPP')}</p>
                        </div>
                      )}
                      {subscription?.next_billing_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Next Billing Date</p>
                          <p>{format(new Date(subscription.next_billing_date), 'PPP')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">No Active Subscription</span>
                    </div>
                    
                    <div className="py-4 text-center">
                      <p className="mb-4 text-muted-foreground">
                        Upgrade to SleekTrade Pro to access premium features including AI-powered
                        trading strategies, unlimited trade tracking, and advanced analytics.
                      </p>
                      <Button onClick={() => navigate("/subscription")}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscribe Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              {isSubscribed && (
                <>
                  <Separator />
                  <CardFooter className="pt-4">
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                    >
                      {isCanceling ? "Processing..." : "Cancel Subscription"}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
