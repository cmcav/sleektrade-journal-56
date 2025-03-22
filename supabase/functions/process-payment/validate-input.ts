
import { sanitizeInput } from "./validation.ts";

/**
 * Sanitizes all user input from the request body to prevent injection attacks
 * @param rawBody The raw request body from the client
 * @returns Sanitized request body
 */
export function sanitizeUserInput(rawBody: any) {
  if (!rawBody) return {};
  
  return {
    cardData: rawBody.cardData ? {
      cardNumber: rawBody.cardData.cardNumber ? String(rawBody.cardData.cardNumber).replace(/\D/g, '') : '',
      expiryMonth: rawBody.cardData.expiryMonth ? String(rawBody.cardData.expiryMonth).replace(/\D/g, '') : '',
      expiryYear: rawBody.cardData.expiryYear ? String(rawBody.cardData.expiryYear).replace(/\D/g, '') : '',
      cvv: rawBody.cardData.cvv ? String(rawBody.cardData.cvv).replace(/\D/g, '') : '',
    } : null,
    amount: rawBody.amount ? sanitizeInput(String(rawBody.amount)) : '',
    planType: rawBody.planType ? sanitizeInput(String(rawBody.planType)) : '',
    billingAddress: rawBody.billingAddress ? {
      firstName: sanitizeInput(String(rawBody.billingAddress.firstName || '')),
      lastName: sanitizeInput(String(rawBody.billingAddress.lastName || '')),
      address: sanitizeInput(String(rawBody.billingAddress.address || '')),
      city: sanitizeInput(String(rawBody.billingAddress.city || '')),
      state: sanitizeInput(String(rawBody.billingAddress.state || '')),
      zip: rawBody.billingAddress.zip ? String(rawBody.billingAddress.zip).replace(/[^\w\s-]/g, '') : '',
    } : null,
    discountCode: rawBody.discountCode ? sanitizeInput(String(rawBody.discountCode)) : null,
  };
}
