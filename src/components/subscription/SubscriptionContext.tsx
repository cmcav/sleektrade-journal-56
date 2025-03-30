
import React, { createContext, useContext, useState, useEffect } from "react";

type SubscriptionContextType = {
  planType: "monthly" | "yearly";
  setPlanType: (type: "monthly" | "yearly") => void;
  discount: { code: string; percentage: number; valid: boolean } | null;
  setDiscount: (discount: { code: string; percentage: number; valid: boolean } | null) => void;
  calculatePrice: () => string;
  isFreeSubscription: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [discount, setDiscount] = useState<{
    code: string;
    percentage: number;
    valid: boolean;
  } | null>(null);
  const [isFreeSubscription, setIsFreeSubscription] = useState(false);

  // Pricing constants
  const monthlyPrice = 9.99;
  const yearlyMonthlyPrice = 8.33;
  const yearlyTotal = yearlyMonthlyPrice * 12;

  // Calculate discounted amount
  const calculatePrice = () => {
    const basePrice = planType === "monthly" ? monthlyPrice : yearlyTotal;
    
    if (discount && discount.valid) {
      const discountAmount = (basePrice * discount.percentage) / 100;
      const finalPrice = (basePrice - discountAmount);
      
      // If price is zero or negative due to rounding or 100% discount, return 0
      return finalPrice <= 0 ? "0.00" : finalPrice.toFixed(2);
    }
    
    return basePrice.toFixed(2);
  };

  // Update isFreeSubscription whenever discount or planType changes
  useEffect(() => {
    const price = parseFloat(calculatePrice());
    setIsFreeSubscription(price === 0);
  }, [discount, planType]);

  return (
    <SubscriptionContext.Provider value={{ 
      planType, 
      setPlanType, 
      discount, 
      setDiscount,
      calculatePrice,
      isFreeSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};
