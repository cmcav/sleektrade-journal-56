
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = () => {
    if (user) {
      navigate("/subscription");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    "Unlimited trade tracking",
    "Advanced analytics",
    "AI strategy suggestions",
    "TradingView chart integration",
    "Performance reports",
    "Export data to CSV/Excel"
  ];

  // Updated pricing constants
  const monthlyPrice = 9.99;
  const yearlyMonthlyPrice = 8.00;
  const yearlyTotal = yearlyMonthlyPrice * 12;
  const yearlySavings = (monthlyPrice * 12) - yearlyTotal;

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
              Pricing
            </Badge>
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Simple, Transparent Pricing
          </motion.h2>
          
          <motion.p 
            className="max-w-[700px] text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Elevate your trading with our powerful tools at an affordable price
          </motion.p>
          
          <motion.div 
            className="flex items-center space-x-2 mt-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Button 
              variant={billingCycle === "monthly" ? "default" : "outline"} 
              onClick={() => setBillingCycle("monthly")}
              className="rounded-full"
            >
              Monthly
            </Button>
            <Button 
              variant={billingCycle === "yearly" ? "default" : "outline"} 
              onClick={() => setBillingCycle("yearly")}
              className="rounded-full"
            >
              Yearly <Badge variant={billingCycle === "yearly" ? "default" : "outline"} className={`ml-2 ${billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>Save ${yearlySavings.toFixed(2)}</Badge>
            </Button>
          </motion.div>
        </div>

        <motion.div 
          className="grid max-w-md mx-auto mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Card className="flex flex-col overflow-hidden border-2 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">SleekTrade Pro</CardTitle>
              <CardDescription>Everything you need to master your trading</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold">${billingCycle === "monthly" ? monthlyPrice.toFixed(2) : yearlyMonthlyPrice.toFixed(2)}</span>
                <span className="ml-1 text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "mo, billed yearly"}</span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-primary font-medium mt-2">${yearlyTotal.toFixed(2)} per year (save ${yearlySavings.toFixed(2)})</p>
              )}
              <ul className="mt-6 space-y-3 w-full text-left">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4 pb-8 px-6">
              <Button className="w-full py-6" onClick={handleSubscribe}>
                <CreditCard className="mr-2 h-4 w-4" />
                {user ? "Subscribe Now" : "Sign Up & Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
