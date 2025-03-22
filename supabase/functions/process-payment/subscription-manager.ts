
// Handle free subscription creation and management
export async function handleFreeSubscription(userId: string, planType: string, appliedDiscount: any, supabase: any) {
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
      amount: 0,
      card_last_four: "FREE",
      next_billing_date: nextBillingDate.toISOString(),
      subscription_date: new Date().toISOString()
    });
  
  if (subscriptionError) {
    console.error("Error saving free subscription:", subscriptionError);
    return {
      success: false,
      message: "Error creating free subscription"
    };
  }
  
  // Update discount code usage count if a valid discount was applied
  if (appliedDiscount) {
    await updateDiscountUsage(appliedDiscount.id, supabase);
  }
  
  return {
    success: true,
    transactionId: "FREE-" + Date.now(),
    discountApplied: appliedDiscount ? appliedDiscount.percentage : 0,
    finalAmount: 0,
    message: "Free subscription activated"
  };
}

// Save subscription information to the database
export async function saveSubscription({ userId, planType, amount, cardLastFour, supabase }: {
  userId: string;
  planType: string;
  amount: number;
  cardLastFour: string;
  supabase: any;
}) {
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
    
  return subscriptionError;
}

// Update usage count for a discount code
export async function updateDiscountUsage(discountId: string, supabase: any) {
  const { error: discountUpdateError } = await supabase
    .from("discount_codes")
    .update({ 
      uses_count: supabase.rpc('increment', { row_id: discountId, increment_amount: 1 }) 
    })
    .eq("id", discountId);
    
  if (discountUpdateError) {
    console.error("Error updating discount code usage:", discountUpdateError);
  }
  
  return discountUpdateError;
}
