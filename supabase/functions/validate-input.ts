
/**
 * A dedicated input validation module for Supabase edge functions
 * Provides standardized methods for sanitizing and validating user inputs
 */

/**
 * Sanitizes string input to prevent XSS attacks by escaping HTML special characters
 * @param input The input string to sanitize
 * @returns Sanitized string with HTML special characters escaped
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      default: return char;
    }
  });
}

/**
 * Validates email format
 * @param email The email string to validate
 * @returns Boolean indicating if the email format is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Recursively sanitizes all string values in an object
 * @param input Object containing values to sanitize
 * @returns New object with sanitized values
 */
export function sanitizeUserInput(input: Record<string, any>): Record<string, any> {
  if (!input || typeof input !== 'object') return {};
  
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : 
        (item && typeof item === 'object') ? sanitizeUserInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeUserInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes and validates payment request data
 * @param rawBody The raw request body from payment requests
 * @returns Sanitized and validated payment data
 */
export function sanitizePaymentInput(rawBody: any) {
  if (!rawBody) return {};
  
  // First pass: use the generic sanitization for all string values
  const sanitized = sanitizeUserInput(rawBody);
  
  // Second pass: apply specific sanitization rules for payment data
  return {
    cardData: sanitized.cardData ? {
      cardNumber: sanitized.cardData.cardNumber ? String(sanitized.cardData.cardNumber).replace(/\D/g, '') : '',
      expiryMonth: sanitized.cardData.expiryMonth ? String(sanitized.cardData.expiryMonth).replace(/\D/g, '') : '',
      expiryYear: sanitized.cardData.expiryYear ? String(sanitized.cardData.expiryYear).replace(/\D/g, '') : '',
      cvv: sanitized.cardData.cvv ? String(sanitized.cardData.cvv).replace(/\D/g, '') : '',
    } : null,
    amount: sanitized.amount || '',
    planType: sanitized.planType || '',
    billingAddress: sanitized.billingAddress ? {
      firstName: sanitized.billingAddress.firstName || '',
      lastName: sanitized.billingAddress.lastName || '',
      address: sanitized.billingAddress.address || '',
      city: sanitized.billingAddress.city || '',
      state: sanitized.billingAddress.state || '',
      zip: sanitized.billingAddress.zip ? String(sanitized.billingAddress.zip).replace(/[^\w\s-]/g, '') : '',
    } : null,
    discountCode: sanitized.discountCode || null,
  };
}

/**
 * Validates that an input string contains only alphanumeric characters
 * @param input The string to validate
 * @returns Boolean indicating if the string is alphanumeric
 */
export function isAlphanumeric(input: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(input);
}

/**
 * Sanitizes numeric input by removing all non-numeric characters
 * @param input The input to sanitize
 * @returns Sanitized numeric string
 */
export function sanitizeNumeric(input: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '');
}
