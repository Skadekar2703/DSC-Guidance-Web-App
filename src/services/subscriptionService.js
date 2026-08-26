import { supabase } from "../lib/supabase";

/**
 * Fetches the active single subscription plan.
 */
export const getSubscriptionPlan = async () => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Updates the price of a subscription plan.
 * @param {string} id - Plan UUID
 * @param {number} priceInRupees - New price in INR (e.g. 199 or 249)
 */
export const updateSubscriptionPlan = async (id, priceInRupees) => {
  const numericPrice = Number(priceInRupees);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    throw new Error("Price must be a valid positive amount.");
  }

  // Convert INR to paise for Razorpay integration (1 INR = 100 Paise)
  const priceInPaise = Math.round(numericPrice * 100);

  const payload = {
    price: priceInPaise,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("subscription_plans")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
