
import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionSummary } from "./SubscriptionSummary";

export default function SubscriptionPage() {
  const navigate = useNavigate();

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
            <SubscriptionForm navigate={navigate} />
          </motion.div>
          
          <motion.div 
            className="md:col-span-5 order-1 md:order-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SubscriptionSummary />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
