import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionContext } from "./SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, CreditCard as CreditCardIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCreditInfo } from "./UserCreditInfo";

const SubscriptionPage = () => {
  const { planType, setPlanType, discount, setDiscount, calculatePrice, isFreeSubscription } = useSubscriptionContext();
  const [discountCode, setDiscountCode] = useState("");
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, cancelSubscription } = useSubscription();
  const [isCancelling, setIsCancelling] = useState(false);

  // Reset payment state when component mounts
  useEffect(() => {
    setPaymentSuccess(false);
    setPaymentError(null);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    // If the subscription is free due to a 100% discount, process it without payment info
    if (isFreeSubscription) {
      await processFreeSubscription();
      return;
    }

    // Validate form fields
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Format card data for processing
      const paymentData = {
        cardData: {
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
        },
        amount: calculatePrice(),
        planType,
        billingAddress: {
          firstName,
          lastName,
          address,
          city,
          state,
          zip,
        },
        discountCode: discount?.code || null,
      };

      // Call the Supabase Edge Function to process the payment
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: paymentData,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.message || "Payment processing failed");
      }

      // Payment successful
      setPaymentSuccess(true);
      toast({
        title: "Subscription successful",
        description: `You are now subscribed to the ${planType} plan`,
      });

      // Clear form
      resetForm();
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error instanceof Error ? error.message : "Payment processing failed");
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processFreeSubscription = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Call the Supabase Edge Function to process the free subscription
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          amount: "0.00",
          planType,
          discountCode: discount?.code || null,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.message || "Subscription processing failed");
      }

      // Subscription successful
      setPaymentSuccess(true);
      toast({
        title: "Subscription successful",
        description: `You are now subscribed to the ${planType} plan`,
      });
    } catch (error) {
      console.error("Subscription error:", error);
      setPaymentError(error instanceof Error ? error.message : "Subscription processing failed");
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Subscription processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateForm = () => {
    // Skip validation for free subscriptions
    if (isFreeSubscription) return true;

    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 15) {
      toast({
        title: "Invalid card number",
        description: "Please enter a valid card number",
        variant: "destructive",
      });
      return false;
    }

    if (!expiryMonth || !expiryYear) {
      toast({
        title: "Invalid expiry date",
        description: "Please enter a valid expiry date",
        variant: "destructive",
      });
      return false;
    }

    if (!cvv || cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV code",
        variant: "destructive",
      });
      return false;
    }

    if (!firstName || !lastName) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return false;
    }

    if (!address || !city || !state || !zip) {
      toast({
        title: "Address required",
        description: "Please enter your complete billing address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setCardNumber("");
    setExpiryMonth("");
    setExpiryYear("");
    setCvv("");
    setFirstName("");
    setLastName("");
    setAddress("");
    setCity("");
    setState("");
    setZip("");
    setDiscountCode("");
    setDiscount(null);
  };

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

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  // Function to navigate back to plans tab
  const navigateToPlansTab = () => {
    const plansTab = document.querySelector('[data-value="plans"]') as HTMLElement;
    if (plansTab) {
      plansTab.click();
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
                      onClick={handleCancelSubscription}
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
            ) : paymentSuccess ? (
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
                  <Button variant="outline" onClick={() => setPaymentSuccess(false)}>
                    Back to Subscription
                  </Button>
                  <Button onClick={() => window.location.href = "/dashboard"}>
                    Go to Dashboard
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="space-y-6">
                <Tabs defaultValue="plans" className="space-y-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="payment">Payment Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="plans" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className={planType === "monthly" ? "border-primary" : ""}>
                        <CardHeader>
                          <CardTitle>Monthly Plan</CardTitle>
                          <CardDescription>
                            Billed monthly, cancel anytime
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        <CardFooter>
                          <Button
                            className="w-full"
                            variant={planType === "monthly" ? "default" : "outline"}
                            onClick={() => setPlanType("monthly")}
                          >
                            {planType === "monthly" ? "Selected" : "Select Plan"}
                          </Button>
                        </CardFooter>
                      </Card>

                      <Card className={planType === "yearly" ? "border-primary" : ""}>
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
                        <CardContent className="space-y-4">
                          <div className="text-3xl font-bold">
                            ${discount && discount.valid
                              ? ((95.90 * (100 - discount.percentage)) / 100).toFixed(2)
                              : "95.90"}
                            <span className="text-sm font-normal text-muted-foreground">
                              /year
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Equivalent to $7.99/month
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
                        <CardFooter>
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
                  </TabsContent>

                  <TabsContent value="payment">
                    <form onSubmit={handleSubmit}>
                      <Card>
                        <CardHeader>
                          <CardTitle>Payment Information</CardTitle>
                          <CardDescription>
                            Enter your payment details to complete your subscription
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="p-4 bg-muted rounded-md">
                            <h3 className="font-medium mb-2">Order Summary</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Plan</span>
                                <span className="text-sm font-medium capitalize">{planType}</span>
                              </div>
                              {discount && discount.valid && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Discount</span>
                                  <span className="text-sm font-medium">-{discount.percentage}%</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Total</span>
                                <span className="text-sm font-bold">${calculatePrice()}</span>
                              </div>
                            </div>
                          </div>

                          {isFreeSubscription ? (
                            <Alert className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/50">
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertDescription>
                                Your subscription is free with the applied discount code. No payment information is required.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <>
                              <div className="space-y-4">
                                <h3 className="font-medium">Card Details</h3>
                                <div className="grid gap-4">
                                  <div>
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <div className="relative mt-1">
                                      <Input
                                        id="cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        maxLength={19}
                                      />
                                      <CreditCardIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor="expiryMonth">Month</Label>
                                      <Input
                                        id="expiryMonth"
                                        placeholder="MM"
                                        value={expiryMonth}
                                        onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                        maxLength={2}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="expiryYear">Year</Label>
                                      <Input
                                        id="expiryYear"
                                        placeholder="YY"
                                        value={expiryYear}
                                        onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                                        maxLength={2}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cvv">CVV</Label>
                                      <Input
                                        id="cvv"
                                        placeholder="123"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                        maxLength={4}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="font-medium">Billing Address</h3>
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="firstName">First Name</Label>
                                      <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="lastName">Last Name</Label>
                                      <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                      id="address"
                                      placeholder="123 Main St"
                                      value={address}
                                      onChange={(e) => setAddress(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor="city">City</Label>
                                      <Input
                                        id="city"
                                        placeholder="New York"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="state">State</Label>
                                      <Input
                                        id="state"
                                        placeholder="NY"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="zip">ZIP Code</Label>
                                      <Input
                                        id="zip"
                                        placeholder="10001"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, ""))}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {paymentError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{paymentError}</AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button type="button" variant="outline" onClick={navigateToPlansTab}>
                            Back to Plans
                          </Button>
                          <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : isFreeSubscription ? (
                              "Activate Free Subscription"
                            ) : (
                              `Pay $${calculatePrice()}`
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>
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
            )}
          </div>
        </main>
      </PageTransition>
    </>
  );
};

export default SubscriptionPage;
