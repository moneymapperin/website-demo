/**
 * MoneyMapper Currency & Number Formatters
 * Ported 1:1 from Flutter Dart sources in reference/moneymapper_app/
 * Per Rule 1: The CODE wins. Formatters named explicitly per their source Dart files.
 */

/**
 * Ported 1:1 from reference/moneymapper_app/lib/widgets/live_financial_calculator.dart (lines 33-35)
 * Dart: "₹${amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}"
 */
export function formatCurrency_LiveFinancialCalculator(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  return `₹${Math.round(amount).toString().replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1,')}`;
}

/**
 * Ported 1:1 from reference/moneymapper_app/lib/widgets/live_financial_calculator.dart (lines 37-47)
 * Dart:
 *   if (amount >= 10000000) {
 *     double cr = amount / 10000000;
 *     return "₹${cr % 1 == 0 ? cr.toInt() : cr.toStringAsFixed(1)}Cr";
 *   } else if (amount >= 100000) {
 *     double lakh = amount / 100000;
 *     return "₹${lakh % 1 == 0 ? lakh.toInt() : lakh.toStringAsFixed(1)}L";
 *   } else {
 *     return "₹${amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}";
 *   }
 */
export function formatCompactCurrency_LiveFinancialCalculator(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? Math.trunc(cr) : cr.toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? Math.trunc(lakh) : lakh.toFixed(1)}L`;
  } else {
    return `₹${Math.round(amount).toString().replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1,')}`;
  }
}

/**
 * Ported 1:1 from reference/moneymapper_app/lib/screens/dashboard_screen.dart (line 1337)
 * Dart: "₹${price24k.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}"
 */
export function formatGoldPrice_DashboardScreen(price24k: number): string {
  if (isNaN(price24k) || !isFinite(price24k)) return '₹0';
  return `₹${price24k.toFixed(0).replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1,')}`;
}

/**
 * Ported 1:1 from reference/moneymapper_app/lib/screens/dashboard_screen.dart (line 581)
 * Dart: "₹${netPosToDisplay.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}"
 */
export function formatNetPosition_DashboardScreen(netPosition: number): string {
  if (isNaN(netPosition) || !isFinite(netPosition)) return '₹0';
  return `₹${Math.round(netPosition).toString().replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1,')}`;
}

/**
 * Ported 1:1 from reference/moneymapper_app/lib/screens/dashboard_screen.dart (lines 929-933)
 * Dart: "₹${amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}"
 */
export function formatQuickStatsCurrency_DashboardScreen(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  return `₹${Math.round(amount).toString().replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1,')}`;
}

// Backward compatibility aliases mapping to Dart formatters
export const formatINR = formatCurrency_LiveFinancialCalculator;
export const formatCompactINR = formatCompactCurrency_LiveFinancialCalculator;
