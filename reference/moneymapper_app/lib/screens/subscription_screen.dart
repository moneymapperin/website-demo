import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:easebuzz_flutter/easebuzz_flutter.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfdropcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentcomponents/cfpaymentcomponent.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/api/cftheme/cftheme.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfexceptions.dart';
import '../services/api_service.dart';
import '../services/premium_service.dart';
import '../theme/app_theme.dart';
import 'main_screen.dart';

class SubPlan {
  final String id; // Matches the database plan_id UUID
  final String planCode;
  final String title;
  final int months;
  final String storePrice; // Monthly price
  final String totalBilledPrice; // Formatted price to display
  final String originalPrice; // Original total price
  final double rawPrice;
  final String discount;
  final String savings;
  final String imageAsset;
  final bool isRecommended;

  SubPlan({
    required this.id,
    required this.planCode,
    required this.title,
    required this.months,
    required this.storePrice,
    required this.totalBilledPrice,
    required this.originalPrice,
    required this.rawPrice,
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
  final EasebuzzFlutter _easebuzzFlutterPlugin = EasebuzzFlutter();
  
  bool _isLoading = true;
  String? _expiryDate;
  List<SubPlan> _plans = [];
  SubPlan? _selectedPlan;
  
  final _referralController = TextEditingController();
  double _appliedDiscount = 0.0;
  String _referralMessage = '';
  bool _isCheckingReferral = false;
  String? _currentOrderId;

  // Cashfree SDK callbacks
  final CFPaymentGatewayService _cfPaymentGatewayService = CFPaymentGatewayService();

  @override
  void initState() {
    super.initState();
    _initData();
    _cfPaymentGatewayService.setCallback(
      verifyPayment,
      onError
    );
  }

  void verifyPayment(String orderId) {
    _handlePaymentResponse({'result': 'payment_successfull'});
  }

  void onError(CFErrorResponse errorResponse, String orderId) {
    _handlePaymentResponse({'result': 'payment_failed', 'message': errorResponse.getMessage()});
  }

  @override
  void dispose() {
    _referralController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    await Future.wait([
      _fetchSubscriptionData(),
      _loadDynamicPlans(),
      _loadSavedReferralCode(),
    ]);
    setState(() => _isLoading = false);
  }

  Future<void> _loadSavedReferralCode() async {
    final prefs = await SharedPreferences.getInstance();
    final savedCode = prefs.getString('saved_referral_code');
    if (savedCode != null && savedCode.isNotEmpty) {
      _referralController.text = savedCode;
      await _validateReferralCode(savedCode);
    }
  }

  Future<void> _validateReferralCode(String code) async {
    if (code.isEmpty) {
      setState(() {
        _appliedDiscount = 0.0;
        _referralMessage = '';
      });
      return;
    }

    setState(() => _isCheckingReferral = true);

    try {
      final supabase = Supabase.instance.client;
      
      // Check if code is valid
      final refResponse = await supabase
          .schema('payments')
          .from('referral_codes')
          .select('discount_amount, is_active')
          .ilike('code', code)
          .maybeSingle();

      if (refResponse == null || refResponse['is_active'] != true) {
        setState(() {
          _appliedDiscount = 0.0;
          _referralMessage = 'Invalid or expired referral code.';
        });
        return;
      }

      // Check if user has already used ANY referral code successfully
      final user = supabase.auth.currentUser;
      if (user != null) {
        final usageCheck = await supabase
            .schema('payments')
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .not('referral_code', 'is', null)
            .eq('status', 'SUCCESS')
            .limit(1);
            
        if (usageCheck.isNotEmpty) {
          setState(() {
            _appliedDiscount = 0.0;
            _referralMessage = 'You have already claimed a referral discount previously.';
          });
          return;
        }
      }

      setState(() {
        _appliedDiscount = double.parse(refResponse['discount_amount'].toString());
        _referralMessage = 'Code Applied! ₹${_appliedDiscount.toStringAsFixed(0)} off.';
      });

    } catch (e) {
      setState(() {
        _appliedDiscount = 0.0;
        _referralMessage = 'Error validating code.';
      });
    } finally {
      if (mounted) setState(() => _isCheckingReferral = false);
    }
  }

  Future<void> _loadDynamicPlans() async {
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase
          .schema('payments')
          .from('plans')
          .select()
          .order('months_duration', ascending: true);

      final List<SubPlan> loadedPlans = [];
      for (var row in data) {
        final double rawPrice = double.parse(row['discounted_price'].toString());
        final double originalPrice = double.parse(row['original_price'].toString());
        final int months = row['months_duration'] as int;
        
        // Calculate monthly breakdown
        final monthlyPrice = (rawPrice / months).toStringAsFixed(0);
        final totalOriginal = originalPrice * months;
        final savingsAmt = totalOriginal - rawPrice;
        final discountPct = ((savingsAmt / totalOriginal) * 100).toStringAsFixed(0);

        // Hardcoded image mapping based on plan duration to ignore DB column
        String mappedImage = "assets/quarterly_plan.png";
        if (months == 6) {
          mappedImage = "assets/half_yearly_2.png";
        } else if (months == 12) {
          mappedImage = "assets/yearly_plan_1.png";
        }

        loadedPlans.add(SubPlan(
          id: row['id'].toString(),
          planCode: row['plan_code'].toString(),
          title: row['title'].toString(),
          months: months,
          storePrice: "₹$monthlyPrice/mo",
          totalBilledPrice: "₹${rawPrice.toStringAsFixed(0)}",
          rawPrice: rawPrice,
          originalPrice: "₹${originalPrice.toStringAsFixed(0)}",
          discount: "$discountPct% OFF",
          savings: "SAVE ₹${savingsAmt.toStringAsFixed(0)}",
          imageAsset: mappedImage,
          isRecommended: row['is_recommended'] == true,
        ));
      }

      if (mounted) {
        setState(() {
          _plans = loadedPlans;
          if (_plans.isNotEmpty) {
            _selectedPlan = _plans.firstWhere((p) => p.isRecommended, orElse: () => _plans.first);
          }
        });
      }
    } catch (e) {
      debugPrint("Failed to load plans: $e");
    }
  }

  Future<void> _fetchSubscriptionData() async {
    try {
      final details = await _api.getSubscriptionDetails();
      if (details != null && details['current_period_end'] != null) {
        final DateTime expiry = DateTime.parse(details['current_period_end']).toLocal();
        if (expiry.isAfter(DateTime.now())) {
          if (mounted) {
            setState(() {
              _expiryDate = "${expiry.day}/${expiry.month}/${expiry.year}";
            });
          }
        }
      }
    } catch (e) {
      debugPrint("Failed to load sub status: $e");
    }
  }

  Future<void> _processCheckout() async {
    if (_selectedPlan == null) return;

    setState(() => _isLoading = true);

    try {
      final supabase = Supabase.instance.client;
      final refCode = _appliedDiscount > 0 ? _referralController.text.trim() : null;

      // Call the Edge Function to generate the access_key
      final response = await supabase.functions.invoke('create_checkout', body: {
        'plan_code': _selectedPlan!.planCode,
        'referral_code': refCode,
      });

      // Safely parse the response data
      dynamic data;
      try {
        if (response.data is String) {
          data = jsonDecode(response.data as String);
        } else {
          data = response.data;
        }
      } catch (_) {
        data = response.data;
      }
      
      // If the edge function explicitly returned an error JSON payload
      if (data is Map && data.containsKey('error')) {
        throw Exception(data['error'].toString());
      }

      if (response.status == 200 && data != null && data is Map) {
        final provider = data['provider']?.toString().toUpperCase() ?? '';

        if (provider.contains('FEDERAL_BANK')) {
          final accessKey = data['access_key']?.toString() ?? '';
          final payMode = data['pay_mode']?.toString() ?? 'test';
          _currentOrderId = data['order_id']?.toString();
          
          if (accessKey.isEmpty) throw Exception("Easebuzz gateway returned an empty access key.");
          if (!mounted) return;
          
          try {
            final paymentResponse = await _easebuzzFlutterPlugin.payWithEasebuzz(accessKey, payMode);
            _handlePaymentResponse(paymentResponse);
          } on PlatformException catch (e) {
            _showError('Payment Gateway Error: ${e.message}');
          }
        } 
        else if (provider.contains('CASHFREE')) {
          final sessionId = data['payment_session_id']?.toString() ?? '';
          final orderId = data['order_id']?.toString() ?? '';
          final payMode = data['pay_mode']?.toString() ?? 'TEST'; // TEST or PROD
          
          _currentOrderId = orderId;

          if (sessionId.isEmpty) throw Exception("Cashfree gateway returned an empty session ID.");
          if (!mounted) return;
          
          try {
            var session = CFSessionBuilder()
                .setEnvironment(payMode == 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX)
                .setOrderId(orderId)
                .setPaymentSessionId(sessionId)
                .build();
                
            var theme = CFThemeBuilder()
                .setNavigationBarBackgroundColorColor("#4F46E5")
                .setPrimaryFont("Roboto")
                .setSecondaryFont("Roboto")
                .build();
                
            var dropCheckoutPayment = CFDropCheckoutPaymentBuilder()
                .setSession(session)
                .setTheme(theme)
                .build();

            _cfPaymentGatewayService.doPayment(dropCheckoutPayment);
          } catch (e) {
            _showError('Cashfree Gateway Error: $e');
          }
        } 
        else {
          // Log exactly what we received from edge function if missing provider
          throw Exception("Unsupported gateway provider. Received: ${jsonEncode(data)}");
        }
      } else {
        throw Exception("Invalid gateway response format from server.");
      }
    } on FunctionException catch (e) {
      // Supabase Edge Function explicit errors
      final errorMsg = e.details != null && e.details is Map && (e.details as Map).containsKey('error')
          ? (e.details as Map)['error']
          : e.reasonPhrase ?? 'Unknown server error';
      _showError('Server Error: $errorMsg');
    } catch (e) {
      // General fallbacks
      _showError('Checkout Error: ${e.toString().replaceAll("Exception: ", "")}');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePaymentResponse(Object? response) {
    if (response == null) return;

    debugPrint("RAW GATEWAY RESPONSE: $response");
    
    Map<String, dynamic> responseData = {};
    if (response is Map) {
      responseData = Map<String, dynamic>.from(response);
    } else if (response is String) {
      try {
        responseData = jsonDecode(response);
      } catch (e) {
        debugPrint("Failed to decode response string: $e");
      }
    }

    if (responseData.isNotEmpty) {
      final result = responseData['result']?.toString() ?? "";
      final message = responseData['message']?.toString();
      
      // Some versions of Easebuzz return deeply nested status inside payment_response
      final paymentResponse = responseData['payment_response'];
      String? nestedStatus;
      String? nestedError;
      if (paymentResponse != null && paymentResponse is Map) {
         nestedStatus = paymentResponse['status']?.toString();
         nestedError = paymentResponse['error_Message']?.toString() ?? paymentResponse['error']?.toString();
      }

      final status = responseData['status']?.toString() ?? nestedStatus ?? "";
      final errorMsg = responseData['error_Message']?.toString() ?? responseData['error']?.toString() ?? nestedError;
      
      if (result == "payment_successfull" || result == "SUCCESS" || status == "success") {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment Successful! Welcome to PRO.'), backgroundColor: Colors.green),
        );
        
        // Finalize transaction and stack subscription
        _finalizeSuccessfulPayment();
      } else if (result == "user_cancelled" || result == "back_pressed" || result == "CANCELLED") {
        _showError('Payment was cancelled.');
      } else {
        _showError(message ?? errorMsg ?? 'Payment failed. Reason: $result');
      }
    } else {
      _showError('Payment processing failed. Unknown response format.');
    }
  }

  Future<void> _finalizeSuccessfulPayment() async {
    try {
      // 1. Stack the subscription length 
      if (_selectedPlan != null) {
        await _api.stackSubscription(_selectedPlan!.months);
      }

      // 2. Mark the transaction as success securely via RPC so referrals count
      if (_currentOrderId != null) {
        await Supabase.instance.client.rpc('finalize_transaction', params: {
          'p_order_id': _currentOrderId!
        });
      }
    } catch (e) {
      debugPrint("Error finalizing payment sync: $e");
    } finally {
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (route) => false,
        );
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
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
                    
                    // Referral Code Section
                    const SizedBox(height: 16),
                    _buildReferralSection(isDark),

                    const SizedBox(height: 16),
                    _buildCheckoutButton(),
                    const SizedBox(height: 12),
                    Center(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.pushNamed(context, '/terms_conditions');
                        },
                        child: Text(
                          "📜 Terms & Conditions / Terms of Use Apply",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                          ),
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

  Widget _buildReferralSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _referralController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    hintText: "Enter Referral Code (Optional)",
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isCheckingReferral ? null : () => _validateReferralCode(_referralController.text.trim()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: _isCheckingReferral 
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text("APPLY"),
              ),
            ],
          ),
          if (_referralMessage.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              _referralMessage,
              style: TextStyle(
                color: _appliedDiscount > 0 ? Colors.green.shade600 : Colors.red.shade400,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildCheckoutButton() {
    if (_selectedPlan == null) return const SizedBox.shrink();

    final finalPrice = _selectedPlan!.rawPrice - _appliedDiscount;
    final displayPrice = finalPrice > 0 ? finalPrice.toStringAsFixed(0) : "0";

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _processCheckout,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: Text(
          "Pay (₹$displayPrice)",
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
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
                            "MOST POPULAR",
                            style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.w900),
                          ),
                        ),
                      ]
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        plan.storePrice,
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        plan.originalPrice,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 14,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          plan.discount,
                          style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        plan.savings,
                        style: const TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Billed at ${plan.totalBilledPrice}",
                    style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600, fontSize: 12),
                  ),
                ],
              ),
            ),
            Image.asset(plan.imageAsset, width: 64, height: 64, fit: BoxFit.contain),
          ],
        ),
      ),
    );
  }
}
