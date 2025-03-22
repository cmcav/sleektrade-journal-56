
/**
 * Utility functions for sanitizing user input to prevent XSS attacks
 */

/**
 * Sanitizes input text by removing HTML tags and trimming whitespace
 * @param input The input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  // Remove any HTML tags
  return input.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Validates an email format
 * @param email The email to validate
 * @returns Boolean indicating if the email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitizeInput(email));
};

/**
 * Validates password strength
 * @param password The password to validate
 * @returns Object with validity status and error message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  // Check for password complexity (at least one uppercase, lowercase, number, and special character)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return { 
      isValid: false, 
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitizes journal title and content to prevent XSS attacks
 * @param input The journal text to sanitize
 * @param maxLength Optional maximum length for the input
 * @returns Sanitized string
 */
export const sanitizeJournalText = (input: string, maxLength?: number): string => {
  if (!input) return "";
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>?/gm, '').trim();
  
  // Truncate if maxLength is provided
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

