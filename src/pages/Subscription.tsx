
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "sonner";
import { CreditCard, Calendar, Lock, Check, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form validation schema
const formSchema = z.object({
  cardName: z.string().min(2, { message: "Name is required" }),
  cardNumber: z.string().regex(/^\d{13,19}$/, { message: "Valid card number required" }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Valid expiry date required (MM/YY)" }),
  cvv: z.string().regex(/^\d{3,4}$/, { message: "Valid CVV required" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Valid ZIP code required" }),
  discountCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Subscription() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [authorizeNetConfig, setAuthorizeNetConfig] = useState<{
    apiLoginId?: string;
    signatureKey?: string;
    environment?: string;
  }>({});
  const [discount, setDiscount] = useState<{
    code: string;
    percentage: number;
    valid: boolean;
  } | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load Authorize.net configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-authnet-config');
        
        if (error) {
          console.error("Error fetching Authorize.net config:", error);
          toast.error("Unable to connect to payment processor. Please try again later.");
          return;
        }
        
        if (data && data.success) {
          setAuthorizeNetConfig({
            apiLoginId: data.apiLoginId,
            signatureKey: data.signatureKey,
            environment: data.environment
          });
        } else {
          toast.error("Payment processor configuration is incomplete.");
        }
      } catch (error) {
        console.error("Failed to fetch payment configuration:", error);
        toast.error("Unable to connect to payment processor. Please try again later.");
      }
    };
    
    fetchConfig();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      discountCode: "",
    },
  });

  // Verify discount code
  const checkDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setDiscount(null);
      return;
    }
    
    setIsCheckingDiscount(true);
    
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("code, percentage, is_active, max_uses, uses_count, expires_at")
        .eq("code", code.trim())
        .single();
      
      if (error || !data || !data.is_active) {
        console.log("Discount code error or not found:", error || "Code not found");
        setDiscount(null);
        form.setError("discountCode", { 
          type: "manual", 
          message: "Invalid or expired discount code" 
        });
      } else {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has expired" 
          });
          return;
        }
        
        // Check if max uses exceeded
        if (data.max_uses !== null && data.uses_count >= data.max_uses) {
          setDiscount(null);
          form.setError("discountCode", { 
            type: "manual", 
            message: "This discount code has reached maximum usage" 
          });
          return;
        }
        
        // Valid discount
        setDiscount({
          code: data.code,
          percentage: data.percentage,
          valid: true
        });
        
        form.clearErrors("discountCode");
        toast.success(`Discount code applied: ${data.percentage}% off`);
      }
    } catch (error) {
      console.error("Error checking discount code:", error);
      setDiscount(null);
    } finally {
      setIsCheckingDiscount(false);
    }
  };
  
  useEffect(() => {
    const discountCode = form.watch("discountCode");
    const debouncedCheck = setTimeout(() => {
      if (discountCode && discountCode.length > 2) {
        checkDiscountCode(discountCode);
      }
    }, 500);
    
    return () => clearTimeout(debouncedCheck);
  }, [form.watch("discountCode")]);

  // Calculate discounted amount
  const calculatePrice = () => {
    const basePrice = planType === "monthly" ? 9.99 : 95.90;
    
    if (discount && discount.valid) {
      const discountAmount = (basePrice * discount.percentage) / 100;
      return (basePrice - discountAmount).toFixed(2);
    }
    
    return basePrice;
  };

  // Handle form submission with Authorize.net
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (!authorizeNetConfig.apiLoginId || !authorizeNetConfig.signatureKey) {
        toast.error("Payment processor not ready. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      if (!user) {
        toast.error("You must be logged in to subscribe");
        navigate("/auth");
        return;
      }
      
      // Parse expiry date
      const [expiryMonth, expiryYear] = data.expiryDate.split('/');
      
      // Prepare card data to send directly to process-payment function
      const cardData = {
        cardNumber: data.cardNumber,
        expiryMonth,
        expiryYear,
        cvv: data.cvv
      };
      
      // Prepare billing address
      const billingAddress = {
        firstName: data.cardName.split(' ')[0],
        lastName: data.cardName.split(' ').slice(1).join(' '),
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zipCode
      };
      
      // Determine subscription amount and apply discount if valid
      const amount = calculatePrice();
      
      // Call our edge function to process the payment
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-payment', {
        body: {
          cardData,
          amount,
          planType,
          billingAddress,
          discountCode: discount?.valid ? discount.code : null
        }
      });
      
      if (paymentError || (paymentResult && !paymentResult.success)) {
        console.error("Payment error:", paymentError || (paymentResult && paymentResult.message));
        toast.error(paymentResult?.message || "There was an error processing your payment. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Payment successful
      toast.success("Subscription activated successfully!");
      
      // Here you could update the user's subscription status in your database
      
      setTimeout(() => navigate("/dashboard"), 1500);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("There was an error processing your payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, "").replace(/\D/g, "");
  };

  const formatExpiryDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    
    if (cleanValue.length >= 3) {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
    }
    
    return cleanValue;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 container max-w-4xl mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">You're just one step away from unlocking premium features</p>
        </motion.div>

        <div className="grid md:grid-cols-12 gap-8">
          <motion.div 
            className="md:col-span-7 order-2 md:order-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Your payment is secured with 256-bit SSL encryption</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name on Card</FormLabel>
                            <FormControl>
                              <Input placeholder="John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="1234 5678 9012 3456" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(formatCardNumber(e.target.value));
                                  }}
                                  maxLength={19}
                                />
                                <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="MM/YY" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(formatExpiryDate(e.target.value));
                                    }}
                                    maxLength={5}
                                  />
                                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="123" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e.target.value.replace(/\D/g, ""));
                                    }}
                                    maxLength={4}
                                    type="password"
                                  />
                                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="NY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP</FormLabel>
                                <FormControl>
                                  <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="discountCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Code</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Enter code if you have one" 
                                  {...field} 
                                />
                                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              </div>
                            </FormControl>
                            <FormMessage />
                            {isCheckingDiscount && (
                              <p className="text-xs text-muted-foreground mt-1">Checking discount code...</p>
                            )}
                            {discount && discount.valid && (
                              <p className="text-xs text-green-600 mt-1">
                                {discount.percentage}% discount applied!
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Subscribe Now"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="md:col-span-5 order-1 md:order-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>SleekTrade Pro Subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-1">
                    <p className="font-medium">Select Plan</p>
                    <p className="text-sm text-muted-foreground">Choose billing frequency</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant={planType === "monthly" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPlanType("monthly")}
                    >
                      Monthly
                    </Button>
                    <Button 
                      variant={planType === "yearly" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPlanType("yearly")}
                    >
                      Yearly
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Base Plan</span>
                    <span>${planType === "monthly" ? "9.99" : "95.90"} {planType === "monthly" ? "/mo" : "/year"}</span>
                  </div>
                  
                  {planType === "yearly" && (
                    <div className="flex justify-between text-primary">
                      <span>Annual discount (20%)</span>
                      <span>-$23.98</span>
                    </div>
                  )}
                  
                  {discount && discount.valid && (
                    <div className="flex justify-between text-green-600 pt-2">
                      <span>Discount ({discount.percentage}%)</span>
                      <span>
                        -${(planType === "monthly" ? 9.99 : 95.90) * discount.percentage / 100}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${calculatePrice()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {planType === "monthly" ? "Billed monthly" : "Billed annually"}
                  </p>
                </div>
                
                <div className="rounded-lg bg-primary/5 p-4 text-sm">
                  <p className="font-medium mb-2">What's included:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                      <span>Unlimited trade tracking</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                      <span>Advanced analytics and reports</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                      <span>AI-powered trading strategies</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                      <span>Priority customer support</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Add Authorize.net types
declare global {
  interface Window {
    Accept: {
      dispatch: (config: any) => void;
    };
  }
}
