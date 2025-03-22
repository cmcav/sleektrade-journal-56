
// Process payments through Authorize.net

// Create and send payment request to Authorize.net
export async function handleAuthorizeNetPayment({
  cardData,
  amount,
  planType,
  billingAddress,
  userId,
  clientIp
}: {
  cardData: any;
  amount: number;
  planType: string;
  billingAddress: any;
  userId: string;
  clientIp: string;
}) {
  // Get API keys from environment variables
  const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
  const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");
  const environment = Deno.env.get("AUTHNET_ENVIRONMENT") || "SANDBOX";
  
  if (!apiLoginId || !transactionKey) {
    console.error("Missing Authorize.net credentials:", { 
      apiLoginId: !!apiLoginId, 
      transactionKey: !!transactionKey 
    });
    
    return {
      success: false,
      message: "Authorize.net configuration is missing",
      transactionId: null
    };
  }
  
  console.log("Using Authorize.net credentials:", { 
    apiLoginId, 
    environment,
    transactionKeyLength: transactionKey.length // Log length only, not the actual key
  });
  
  // Determine recurring billing interval
  const recurringBillingInterval = planType === "monthly" ? 1 : 12;
  
  // Create the payment request body
  // Truncate subscription name to avoid MaxLength errors
  const subscriptionName = `SleekPro ${planType === "monthly" ? "Monthly" : "Annual"}`;
  
  // Set up subscription details
  const payload = createPaymentPayload({
    apiLoginId,
    transactionKey,
    amount: amount.toString(),
    cardData,
    subscriptionName,
    userId,
    billingAddress,
    clientIp,
    recurringBillingInterval,
    planType
  });
  
  // Determine endpoint URL based on environment
  const apiEndpoint = environment === "PRODUCTION" 
    ? "https://api.authorize.net/xml/v1/request.api"
    : "https://apitest.authorize.net/xml/v1/request.api";
  
  console.log("Sending payment request to Authorize.net:", JSON.stringify(payload));
  
  // Make the API request to Authorize.net
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  console.log("Response from Authorize.net:", JSON.stringify(result));
  
  // Process response
  if (
    result.transactionResponse &&
    result.transactionResponse.responseCode === "1"
  ) {
    // Transaction approved
    return {
      success: true,
      transactionId: result.transactionResponse.transId,
      message: "Payment successful"
    };
  } else {
    // Transaction failed
    const errorMessage = 
      result.transactionResponse?.errors?.[0]?.errorText ||
      result.messages?.message?.[0]?.text ||
      "Payment processing failed";
    
    return {
      success: false,
      message: errorMessage,
      transactionId: null
    };
  }
}

// Create the payload for Authorize.net payment request
function createPaymentPayload({
  apiLoginId,
  transactionKey,
  amount,
  cardData,
  subscriptionName,
  userId,
  billingAddress,
  clientIp,
  recurringBillingInterval,
  planType
}: {
  apiLoginId: string;
  transactionKey: string;
  amount: string;
  cardData: any;
  subscriptionName: string;
  userId: string;
  billingAddress: any;
  clientIp: string;
  recurringBillingInterval: number;
  planType: string;
}) {
  return {
    createTransactionRequest: {
      merchantAuthentication: {
        name: apiLoginId,
        transactionKey: transactionKey
      },
      refId: Date.now().toString(),
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount: amount,
        payment: {
          creditCard: {
            cardNumber: cardData.cardNumber,
            expirationDate: `${cardData.expiryMonth}${cardData.expiryYear}`,
            cardCode: cardData.cvv
          }
        },
        lineItems: {
          lineItem: {
            itemId: "sub1",
            name: subscriptionName,
            quantity: 1,
            unitPrice: amount
          }
        },
        tax: {
          amount: "0.00",
          name: "Tax",
          description: "Tax"
        },
        customer: {
          id: userId,
          email: ""
        },
        billTo: billingAddress,
        customerIP: clientIp,
        // Add subscription details to indicate this is a recurring payment
        subscription: {
          paymentSchedule: {
            interval: {
              length: recurringBillingInterval,
              unit: "months"
            },
            startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            totalOccurrences: 9999, // Unlimited until canceled
            trialOccurrences: 0
          },
          name: subscriptionName,
          description: `SleekTrade ${planType} Subscription`
        },
        processingOptions: {
          isRecurring: true
        }
      }
    }
  };
}
