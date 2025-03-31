import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionContext } from "./SubscriptionContext";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planType, setPlanType, discount, setDiscount, calculatePrice, isFreeSubscription } = useSubscriptionContext();
  const [discountCode, setDiscountCode] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const acceptUIContainer = useRef(null);

  useEffect(() => {
    if (!window.Accept) {
      const script = document.createElement("script");
      script.src = "https://js.authorize.net/v1/Accept.js";
      script.async = true;
      script.onload = () => {
        console.log("Authorize.net Accept.js loaded");
      };
      script.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load Authorize.net payment gateway.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  const features = [
    "Unlimited trade tracking",
    "Advanced analytics",
    "AI strategy suggestions",
    "TradingView chart integration",
    "Performance reports",
    "Export data to CSV/Excel"
  ];

  const handleApplyDiscount = async () => {
    setApplyingDiscount(true);
    // Basic validation, improve as needed
    if (discountCode.toLowerCase() === "halfoff") {
      setDiscount({ code: discountCode, percentage: 50, valid: true });
      toast({
        title: "Discount Applied",
        description: "50% discount applied successfully!",
      });
    } else {
      setDiscount({ code: discountCode, percentage: 0, valid: false });
      toast({
        title: "Invalid Discount Code",
        description: "The discount code you entered is not valid.",
        variant: "destructive",
      });
    }
    setApplyingDiscount(false);
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setPaymentProcessing(true);

    const authData = {
      name: "John",
      cardNumber: "4111111111111111",
      month: "01",
      year: "2025",
      cardCode: "123",
      zip: "12345",
    };

    const secureData = {
      authData: authData,
      clientKey: process.env.NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY,
      apiLoginID: process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID,
    };

    // Mock payment processing
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your payment was processed successfully!",
      });
      setPaymentProcessing(false);
    }, 3000);
  };

  // Pricing constants for display
  const monthlyPrice = 9.99;
  const yearlyMonthlyPrice = 8.33;
  const yearlyTotal = 99.96;
  const yearlySavings = 19.92;

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                Subscription
              </Badge>
            </motion.div>

            <motion.h2
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Choose Your Plan
            </motion.h2>

            <motion.p
              className="max-w-[700px] text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Start your journey to better trading with SleekTrade Pro.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col items-center space-y-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Have a discount code?</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="border p-2 rounded-md"
                />
                <Button onClick={handleApplyDiscount} disabled={applyingDiscount}>
                  {applyingDiscount ? "Applying..." : "Apply"}
                </Button>
              </div>
            </div>

            <div className="text-xl font-semibold">
              Total: ${calculatePrice()} {isFreeSubscription && <Badge className="ml-2">Free</Badge>}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card 
              className={`flex flex-col overflow-hidden border-2 ${
                planType === "monthly" ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {/* Monthly Plan Card */}
              <CardHeader className="text-center">
                <CardTitle>Monthly Plan</CardTitle>
                <CardDescription>Billed monthly, cancel anytime</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="text-3xl font-bold mb-4">
                  ${monthlyPrice.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <ul className="space-y-2 flex-grow">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-auto" 
                  variant={planType === "monthly" ? "default" : "outline"}
                  onClick={() => setPlanType("monthly")}
                >
                  {planType === "monthly" ? "Selected" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>

            <Card 
              className={`flex flex-col overflow-hidden border-2 ${
                planType === "yearly" ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {/* Yearly Plan Card */}
              <CardHeader className="text-center">
                <CardTitle>Yearly Plan</CardTitle>
                <CardDescription>Billed annually, save 20%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="text-3xl font-bold mb-4">
                  ${yearlyTotal.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /year
                  </span>
                  <div className="text-sm text-primary font-medium mt-1">
                    Equivalent to ${yearlyMonthlyPrice.toFixed(2)}/month
                  </div>
                </div>
                <ul className="space-y-2 flex-grow">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span>2 months free</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-auto" 
                  variant={planType === "yearly" ? "default" : "outline"}
                  onClick={() => setPlanType("yearly")}
                >
                  {planType === "yearly" ? "Selected" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <motion.div
            className="flex flex-col items-center justify-center space-y-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button disabled={paymentProcessing} onClick={handlePayment}>
              {paymentProcessing ? "Processing Payment..." : "Subscribe"}
            </Button>
          </motion.div>

          <motion.div
            className="mt-6 text-center text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p>
              By subscribing, you agree to our{" "}
              <a href="#" className="text-primary underline">Terms of Service</a> and{" "}
              <a href="#" className="text-primary underline">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
