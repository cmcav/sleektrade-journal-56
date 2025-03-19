
import React, { useState } from "react";
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
import { CreditCard, Calendar, Lock } from "lucide-react";

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
});

type FormValues = z.infer<typeof formSchema>;

export default function Subscription() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();

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
    },
  });

  // Handle form submission with dummy Authorize.net integration
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Simulating an API call to Authorize.net
    try {
      // In a real application, this would be an API call to your backend
      // which would then interact with Authorize.net
      console.log("Payment data:", { ...data, planType });
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Subscription activated successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("There was an error processing your payment. Please try again.");
    } finally {
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
                    <span>$9.99 /mo</span>
                  </div>
                  
                  {planType === "yearly" && (
                    <div className="flex justify-between text-primary">
                      <span>Annual discount (20%)</span>
                      <span>-$23.98</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{planType === "monthly" ? "$9.99" : "$95.90"}</span>
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
