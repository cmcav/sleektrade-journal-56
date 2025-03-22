
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

// Sanitize input fields to prevent XSS and injection attacks
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  // Remove any HTML tags
  const sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // Trim whitespace
  return sanitized.trim();
}

// Validate and sanitize card data
export function sanitizeCardData(cardData: any): any {
  if (!cardData) return null;
  
  return {
    cardNumber: cardData.cardNumber ? cardData.cardNumber.replace(/\D/g, '') : '',
    expiryMonth: cardData.expiryMonth ? cardData.expiryMonth.replace(/\D/g, '') : '',
    expiryYear: cardData.expiryYear ? cardData.expiryYear.replace(/\D/g, '') : '',
    cvv: cardData.cvv ? cardData.cvv.replace(/\D/g, '') : ''
  };
}

// Validate and sanitize billing address
export function sanitizeBillingAddress(address: any): any {
  if (!address) return null;
  
  return {
    firstName: sanitizeInput(address.firstName),
    lastName: sanitizeInput(address.lastName),
    address: sanitizeInput(address.address),
    city: sanitizeInput(address.city),
    state: sanitizeInput(address.state),
    zip: address.zip ? address.zip.replace(/[^\w\s-]/g, '') : ''
  };
}

// Validate request and extract user ID from authentication token
export async function validateRequest(req: Request, supabase: any) {
  // Extract the user ID from the JWT token in the request
  const authHeader = req.headers.get('Authorization');
  let userId = null;
  
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
    }
  }
  
  if (!userId) {
    return {
      isValid: false,
      userId: null,
      error: "User authentication required"
    };
  }
  
  return {
    isValid: true,
    userId,
    error: null
  };
}

// Validate payment details, including amount and discount code
export async function validatePayment(amount: string, discountCode: string | null, supabase: any) {
  // Check if amount is valid
  const finalAmount = parseFloat(amount);
  if (isNaN(finalAmount)) {
    return {
      isValid: false,
      finalAmount: null,
      appliedDiscount: null,
      error: "Invalid amount provided"
    };
  }
  
  // Verify discount code if provided
  let appliedDiscount = null;
  
  if (discountCode) {
    // Sanitize discount code
    const sanitizedDiscountCode = sanitizeInput(discountCode);
    
    console.log("Checking discount code:", sanitizedDiscountCode);
    
    const { data: discountData, error: discountError } = await supabase
      .from("discount_codes")
      .select("id, code, percentage, max_uses, uses_count, expires_at")
      .eq("code", sanitizedDiscountCode)
      .eq("is_active", true)
      .single();
    
    if (!discountError && discountData) {
      // Validate discount code
      const isExpired = discountData.expires_at && new Date(discountData.expires_at) < new Date();
      const isMaxedOut = discountData.max_uses !== null && discountData.uses_count >= discountData.max_uses;
      
      if (!isExpired && !isMaxedOut) {
        // Apply discount
        appliedDiscount = {
          id: discountData.id,
          code: discountData.code,
          percentage: discountData.percentage
        };
        
        console.log(`Applied discount: ${discountData.percentage}%. Final amount: $${finalAmount}`);
      } else {
        console.log("Discount code invalid:", isExpired ? "expired" : "maxed out");
      }
    } else {
      console.log("Discount code not found or error:", discountError);
    }
  }
  
  return {
    isValid: true,
    finalAmount,
    appliedDiscount,
    error: null
  };
}
