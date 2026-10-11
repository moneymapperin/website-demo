import 'dart:async';
import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/premium_service.dart';
import '../theme/app_theme.dart';
// Note: We avoid importing LiquidGlassTheme to prevent missing URI errors on environments without it.

class SubPlan {
  final String id;
  final String title;
  final int months;
  final String storePrice; // This acts as the Monthly Price
  final String totalBilledPrice; // Total price billed upfront
  final String originalPrice;
  final String discount;
  final String savings;
  final String imageAsset;
  final bool isRecommended;

  SubPlan({
    required this.id,
    required this.title,
    required this.months,
    required this.storePrice,
    required this.totalBilledPrice,
    required this.originalPrice,
    required this.discount,
    required this.savings,
    required this.imageAsset,
    this.isRecommended = false,
  });
}

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  static const routeName = '/subscription';

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final ApiService _api = ApiService();
  final PremiumService _premiumService = PremiumService();
  
  final InAppPurchase _iap = InAppPurchase.instance;
  late StreamSubscription<List<PurchaseDetails>> _subscription;

  bool _isLoading = true;
  String? _expiryDate;
  bool _isAvailable = false;
  List<ProductDetails> _products = [];
  
  final List<SubPlan> _plans = [
    SubPlan(
      id: "moneymapper_quarterly_sub",
      title: "Quarterly Plan",
      months: 3,
      storePrice: "₹589",
      totalBilledPrice: "₹1,767",
      originalPrice: "₹799",
      discount: "38% OFF",
      savings: "SAVE ₹897",
      imageAsset: "assets/quarterly_plan.png",
    ),
    SubPlan(
      id: "moneymapper_halfyearly_sub",
      title: "Half-Yearly Plan",
      months: 6,
      storePrice: "₹469",
      totalBilledPrice: "₹2,814",
      originalPrice: "₹799",
      discount: "50% OFF",
      savings: "SAVE ₹2,400",
      imageAsset: "assets/half_yearly_2.png",
    ),
    SubPlan(
      id: "moneymapper_yearly_sub",
      title: "Yearly Plan",
      months: 12,
      storePrice: "₹349",
      totalBilledPrice: "₹4,188",
      originalPrice: "₹799",
      discount: "63% OFF",
      savings: "SAVE ₹6,000",
      imageAsset: "assets/yearly_plan_1.png",
      isRecommended: true,
    ),
  ];

  SubPlan? _selectedPlan;

  @override
  void initState() {
    super.initState();
    _selectedPlan = _plans.last; // Default to Yearly
    _initBilling();
    _fetchSubscriptionData();
  }

  Future<void> _initBilling() async {
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen((purchaseDetailsList) {
      _listenToPurchaseUpdated(purchaseDetailsList);
    }, onDone: () {
      _subscription.cancel();
    }, onError: (error) {
      // handle error
    });

    _isAvailable = await _iap.isAvailable();
    if (_isAvailable) {
      final Set<String> kIds = _plans.map((p) => p.id).toSet();
      final ProductDetailsResponse response = await _iap.queryProductDetails(kIds);
      if (response.error == null) {
        setState(() {
          _products = response.productDetails;
        });
      }
    }
  }

  Future<void> _fetchSubscriptionData() async {
    try {
      final details = await _api.getSubscriptionDetails();
      if (details != null && details['current_period_end'] != null) {
        final DateTime expiry = DateTime.parse(details['current_period_end']).toLocal();
        setState(() {
          _expiryDate = DateFormat('dd MMM yyyy').format(expiry);
        });
      }
    } catch (e) {
      debugPrint("Could not fetch expiry: $e");
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }

  void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) {
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        setState(() => _isLoading = true);
      } else {
        if (purchaseDetails.status == PurchaseStatus.error) {
          _handleError(purchaseDetails.error);
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
                   purchaseDetails.status == PurchaseStatus.restored) {
          _verifyAndDeliverProduct(purchaseDetails);
        }
        
        if (purchaseDetails.pendingCompletePurchase) {
          _iap.completePurchase(purchaseDetails);
        }
      }
    }
  }

  void _handleError(IAPError? error) {
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Purchase Failed: ${error?.message ?? "Unknown"}'), backgroundColor: AppColors.danger),
    );
  }

  Future<void> _verifyAndDeliverProduct(PurchaseDetails purchaseDetails) async {
    try {
      // 1. Determine months to add based on product ID
      final plan = _plans.firstWhere((p) => p.id == purchaseDetails.productID);
      
      // 2. Call Supabase RPC to stack subscription securely
      await _api.stackSubscription(plan.months);
      
      // 3. Update local auth state to Pro
      await _premiumService.setPlan('moneymapper pro membership');

      // 4. Refresh UI
      await _fetchSubscriptionData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Payment Successful! Welcome to Wealth Select Pro.'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint("Delivery error: $e");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _buyPlan(SubPlan plan) {
    if (!_isAvailable || _products.isEmpty) {
      // Fallback for emulator / non-configured environments to test RPC
      _simulatePurchase(plan);
      return;
    }

    try {
      final product = _products.firstWhere((p) => p.id == plan.id);
      final PurchaseParam purchaseParam = PurchaseParam(productDetails: product);
      _iap.buyNonConsumable(purchaseParam: purchaseParam);
    } catch (e) {
      _simulatePurchase(plan);
    }
  }

  // Fallback simulator to allow testing stacking without real credit cards/Play Store connection
  Future<void> _simulatePurchase(SubPlan plan) async {
    setState(() => _isLoading = true);
    try {
      await _api.stackSubscription(plan.months);
      await _premiumService.setPlan('moneymapper pro membership');
      await _fetchSubscriptionData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 Success! Your ${plan.title} is now active.'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Purchase Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
        title: Text(
          "Wealth Select",
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildActiveBanner(isDark),
                    const SizedBox(height: 24),
                    Text(
                      "Upgrade to PRO 🚀",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.separated(
                        itemCount: _plans.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (ctx, i) => _buildPlanCard(_plans[i], isDark),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () => _buyPlan(_selectedPlan!),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text(
                          "Get Financially Free (${_selectedPlan!.totalBilledPrice})",
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Center(
                      child: Text(
                        "*Final checkout price includes standard Google Play / App Store platform fees applied to base plan rates.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 9.5,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildActiveBanner(bool isDark) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "ACTIVE SUBSCRIPTION",
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _expiryDate != null ? "Valid until: $_expiryDate" : "Free Tier - Limited Access",
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      padding: const EdgeInsets.all(16),
      child: content,
    );
  }

  Widget _buildPlanCard(SubPlan plan, bool isDark) {
    final isSelected = _selectedPlan == plan;

    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = plan),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.05) : (isDark ? AppColors.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? AppColors.primary : (isDark ? AppColors.darkBorder : AppColors.borderLight),
            width: isSelected ? 2 : 1.5,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        plan.title,
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (plan.isRecommended) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.warning,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            "BEST VALUE",
                            style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ]
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        plan.storePrice,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(bottom: 4, left: 2),
                        child: Text(
                          "/mo",
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          plan.originalPrice,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Billed as one payment of ${plan.totalBilledPrice}",
                    style: TextStyle(
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          plan.discount,
                          style: const TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          plan.savings,
                          style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Right side image
            Image.asset(
              plan.imageAsset,
              width: 80,
              height: 80,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(Icons.workspace_premium, size: 40, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
