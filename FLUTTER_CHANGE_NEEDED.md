# Required Flutter App Changes & Safe Migration Sequence

This document describes the required client-side change for the MoneyMapper Flutter mobile application (`moneymapper_app`) following the deployment of the hardened `finalize_transaction` migration.

---

## 1. Background & Reason for Change

Previously:
- The Flutter mobile client called `_api.stackSubscription(_selectedPlan!.months)` directly from the mobile device to add subscription time.
- Then it called `finalize_transaction` to mark the order as `SUCCESS`.

In the new hardened architecture:
1. `public.finalize_transaction(p_order_id)` verifies payment completion directly with the payment gateway (Cashfree / Easebuzz) and then automatically invokes `public.stack_subscription` on the server using verified plan duration.
2. Permissions to execute `public.stack_subscription` directly from client roles (`anon` and `authenticated`) are revoked in `lockdown_payments_security.sql`.
3. If the Flutter app continues calling `_api.stackSubscription`, it will:
   - Double-credit subscription duration prior to the lockdown migration.
   - Throw a `permission denied for function stack_subscription` error once `lockdown_payments_security.sql` is executed.

---

## 2. Exact Flutter Code Change

**Target File:** `lib/screens/subscription_screen.dart`  
**Method:** `_finalizeSuccessfulPayment()` (Lines ~416-430)

### Current Code:
```dart
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
```

### Updated Code:
```dart
  Future<void> _finalizeSuccessfulPayment() async {
    try {
      // Mark transaction as SUCCESS and stack subscription server-side via verified RPC
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
```

---

## 3. Safe Release & Deployment Order

To ensure zero downtime and prevent broken checkout flows across web and mobile:

### Step 1: Deploy `supabase/migrations/finalize_transaction_secure.sql`
- Replaces `public.finalize_transaction` with the synchronous gateway-verifying and server-stacking implementation.
- Both Web and Flutter apps can immediately call this function.
- `public.stack_subscription` remains temporarily executable during this transitional phase.

### Step 2: Deploy Web App Update
- Deploy the updated MoneyMapper web frontend with `finalizeService.ts` retry logic for `PAYMENT_PENDING`.

### Step 3: Release Flutter Mobile App Update
- Build and publish the updated Flutter app with `_api.stackSubscription` removed.
- Allow users time to update to the latest build.

### Step 4: Execute `supabase/migrations/lockdown_payments_security.sql`
- Run this migration in the Supabase SQL editor to:
  1. Revoke `public.stack_subscription` from `anon` and `authenticated`.
  2. Drop the insert policy on `payments.transactions` and revoke mutation rights.
  3. Lock down `payments.gateway_config`.
  4. Create the unique index on `gateway_transaction_id`.

