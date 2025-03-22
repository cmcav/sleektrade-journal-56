
import React, { createContext, useContext, useState } from "react";

type SubscriptionContextType = {
  planType: "monthly" | "yearly";
  setPlanType: (type: "monthly" | "yearly") => void;
  discount: { code: string; percentage: number; valid: boolean } | null;
  setDiscount: (discount: { code: string; percentage: number; valid: boolean } | null) => void;
  calculatePrice: () => string;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [discount, setDiscount] = useState<{
    code: string;
    percentage: number;
    valid: boolean;
  } | null>(null);

  // Calculate discounted amount
  const calculatePrice = () => {
    const basePrice = planType === "monthly" ? 9.99 : 95.90;
    
    if (discount && discount.valid) {
      const discountAmount = (basePrice * discount.percentage) / 100;
      return (basePrice - discountAmount).toFixed(2);
    }
    
    return basePrice.toFixed(2);
  };

  return (
    <SubscriptionContext.Provider value={{ 
      planType, 
      setPlanType, 
      discount, 
      setDiscount,
      calculatePrice 
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
