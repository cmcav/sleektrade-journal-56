
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CreditCard as CreditCardIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface PaymentFormProps {
  planType: "monthly" | "yearly";
  discount: { code: string; percentage: number; valid: boolean } | null;
  calculatePrice: () => string;
  isFreeSubscription: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  planType,
  discount,
  calculatePrice,
  isFreeSubscription,
  onBack,
  onSuccess
}) => {
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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

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
      onSuccess();
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
      onSuccess();
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

  return (
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
          <Button type="button" variant="outline" onClick={onBack}>
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
  );
};
