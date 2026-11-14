/**
 * Computes effective discount and final price guaranteeing:
 * - Displayed discount = min(discount_amount, plan price)
 * - Displayed final price = max(0, plan price - discount)
 * - Never returns negative price
 */
export function calculateDiscountedPrice(
  planPrice: number,
  discountAmount: number
): { effectiveDiscount: number; finalPrice: number } {
  const safePlanPrice = Math.max(0, Number(planPrice) || 0);
  const safeDiscount = Math.max(0, Number(discountAmount) || 0);
  const effectiveDiscount = Math.min(safeDiscount, safePlanPrice);
  const finalPrice = Math.max(0, safePlanPrice - effectiveDiscount);
  return { effectiveDiscount, finalPrice };
}


