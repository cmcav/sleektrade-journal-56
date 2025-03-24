
// Handle free subscription creation and management
export async function handleFreeSubscription(userId: string, planType: string, appliedDiscount: any, supabase: any) {
  try {
    console.log("Processing free subscription for user:", userId);
    
    // Calculate next billing date - 30 days for monthly, 365 days for annual
    const nextBillingDate = new Date();
    if (planType === "monthly") {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 365);
    }
    
    // Check if user has RLS permissions to insert into subscriptions
    // Use service role for subscription creation to bypass RLS
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRole) {
      console.error("No service role key found for subscription creation");
      return {
        success: false,
        message: "Server configuration error"
      };
    }
    
    const adminClient = supabase.auth.admin;
    
    // Save subscription information using service role to bypass RLS
    const { data, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_type: planType,
        status: "active",
        amount: 0,
        card_last_four: "FREE",
        next_billing_date: nextBillingDate.toISOString(),
        subscription_date: new Date().toISOString()
      })
      .select();
    
    if (subscriptionError) {
      console.error("Error saving free subscription:", subscriptionError);
      return {
        success: false,
        message: "Error creating free subscription"
      };
    }
    
    console.log("Free subscription created:", data);
    
    // Update discount code usage count if a valid discount was applied
    if (appliedDiscount) {
      await updateDiscountUsage(appliedDiscount.id, supabase);
    }
    
    // Also ensure the user has credits initialized
    await initializeUserCredits(userId, supabase);
    
    return {
      success: true,
      transactionId: "FREE-" + Date.now(),
      discountApplied: appliedDiscount ? appliedDiscount.percentage : 0,
      finalAmount: 0,
      message: "Free subscription activated"
    };
  } catch (error) {
    console.error("Free subscription error:", error);
    return {
      success: false,
      message: "Error processing free subscription"
    };
  }
}

// Initialize user credits if they don't exist
async function initializeUserCredits(userId: string, supabase: any) {
  try {
    console.log("Initializing user credits for user:", userId);
    
    // First check if user already has credits
    const { data: existingCredits, error: checkError } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing credits:", checkError);
      return false;
    }
    
    // If user already has credits, no need to create them
    if (existingCredits) {
      console.log("User already has credits:", existingCredits);
      return true;
    }
    
    console.log("Creating new credits for user:", userId);
    
    // Create initial credits for the user
    const now = new Date().toISOString();
    const { error: createError } = await supabase
      .from("user_credits")
      .insert({
        user_id: userId,
        total_credits: 30, // Premium users get 30 credits
        used_credits: 0,
        last_reset_date: now
      });
    
    if (createError) {
      console.error("Error creating initial credits:", createError);
      return false;
    }
    
    console.log("Credits created successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Error initializing user credits:", error);
    return false;
  }
}

// Save subscription information to the database
export async function saveSubscription({ userId, planType, amount, cardLastFour, supabase }: {
  userId: string;
  planType: string;
  amount: number;
  cardLastFour: string;
  supabase: any;
}) {
  try {
    console.log("Saving subscription for user:", userId);
    
    // Calculate next billing date - 30 days for monthly, 365 days for annual
    const nextBillingDate = new Date();
    if (planType === "monthly") {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 365);
    }
    
    // Save subscription information
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_type: planType,
        status: "active",
        amount: amount,
        card_last_four: cardLastFour,
        next_billing_date: nextBillingDate.toISOString(),
        subscription_date: new Date().toISOString()
      });
      
    if (subscriptionError) {
      console.error("Error saving subscription:", subscriptionError);
      return subscriptionError;
    }
    
    console.log("Subscription saved successfully for user:", userId);
    
    // Also ensure the user has credits initialized
    await initializeUserCredits(userId, supabase);
    
    return null;
  } catch (error) {
    console.error("Error in saveSubscription:", error);
    return error;
  }
}

// Update usage count for a discount code
export async function updateDiscountUsage(discountId: string, supabase: any) {
  try {
    console.log("Updating discount usage for discount ID:", discountId);
    
    const { error: discountUpdateError } = await supabase
      .from("discount_codes")
      .update({ 
        uses_count: supabase.rpc('increment', { row_id: discountId, increment_amount: 1 }) 
      })
      .eq("id", discountId);
      
    if (discountUpdateError) {
      console.error("Error updating discount code usage:", discountUpdateError);
    } else {
      console.log("Discount usage updated successfully");
    }
    
    return discountUpdateError;
  } catch (error) {
    console.error("Error in updateDiscountUsage:", error);
    return error;
  }
}
