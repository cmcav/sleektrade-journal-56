
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Calendar, Lock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useSubscriptionContext } from "./SubscriptionContext";
import { useDiscountCode } from "./useDiscountCode";

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

export const SubscriptionForm = ({ navigate }: { navigate: (path: string) => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorizeNetConfig, setAuthorizeNetConfig] = useState<{
    apiLoginId?: string;
    signatureKey?: string;
    environment?: string;
  }>({});
  const { user } = useAuth();
  const { planType, calculatePrice, discount } = useSubscriptionContext();
  const { discount: discountDetails, isCheckingDiscount, checkDiscountCode } = useDiscountCode();

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

  useEffect(() => {
    const discountCode = form.watch("discountCode");
    const debouncedCheck = setTimeout(() => {
      if (discountCode && discountCode.length > 2) {
        checkDiscountCode(discountCode);
      }
    }, 500);
    
    return () => clearTimeout(debouncedCheck);
  }, [form.watch("discountCode"), checkDiscountCode]);

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
                    {discountDetails && discountDetails.valid && (
                      <p className="text-xs text-green-600 mt-1">
                        {discountDetails.percentage}% discount applied!
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
  );
};
