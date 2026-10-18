# 🎯 MoneyMapper — Production Technical Specification & System Architecture

MoneyMapper is an enterprise-grade, cross-platform financial health scoring, intelligence, and wealth advisory platform built for the Indian market using **Flutter (Dart 3.x)**, **Supabase (PostgreSQL 15+)**, and **Bank-Grade Mobile Security**.

---

## 📌 Executive Summary

MoneyMapper evaluates a user's complete financial profile across **5 Financial Pillars** (Income, Expenses, Emergency Readiness, Insurance Coverage, and Asset Allocation) to compute a dynamic **Financial Fitness Score (0–100)**. It delivers live market intelligence (IBJA 24K Gold rates, Nifty 500 stock signals, Mutual Fund screeners), an interactive AI advisory assistant, WhatsApp Web-style QR session handoff, and an automated **Wealth Select Pro** subscription stacking engine.

---

## 🏗️ 1. High-Level System Architecture

MoneyMapper follows a **Decoupled Service-Oriented Architecture** with strict layer separation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (UI)                            │
│  Jetpack-like M3 Compose Styling │ Glassmorphism Theme │ ResponsiveUtils    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            APPLICATION & DOMAIN                             │
│     Stateful Controllers │ ValueNotifiers │ StreamSubscriptions (Realtime)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         SECURITY & SERVICE LAYER                            │
│  SecureNetworkClient (Dio) │ SecureSupabaseStorage │ SecurityService (Keystore) │
└──────────────────────────┬─────────────────────────┬────────────────────────┘
                           │                         │
┌──────────────────────────▼──────────┐   ┌──────────▼────────────────────────┐
│     EXTERNAL BACKEND (SUPABASE)     │   │      LOCAL SECURE VAULT           │
│ PostgreSQL 15+ │ RLS │ Realtime │ RPC│   │ Android Keystore / iOS Keychain   │
└─────────────────────────────────────┘   └───────────────────────────────────┘
```

### Layer Breakdown
* **Presentation Layer**: Material 3 UI with adaptive glassmorphism (`LiquidGlassTheme`) for macOS/iOS and solid card layouts for Android.
* **Domain & Logic Layer**: Financial scoring algorithms (`ScoreCardAdvisor`, `AdvisoryService`), Xp/Milestone gamification (`XpService`), and streak tracking (`StreakService`).
* **Security & Network Layer**: Dio-powered `SecureNetworkClient` with SSL Pinning, automatic JWT token interception, and hardware-encrypted storage (`SecureSupabaseStorage`).
* **Database & Auth Layer**: Supabase Auth (Email/Metadata), PostgreSQL tables protected by Row Level Security (RLS), and custom PL/pgSQL Remote Procedure Calls (RPCs).

---

## 🔐 2. Authentication & Identity System

### A. Core Auth Flow
MoneyMapper uses Supabase Authentication backed by Hardware-Encrypted Token Persistence:
1. **User Sign Up / Sign In**: Authenticates via `_supabase.auth.signInWithPassword()`.
2. **Metadata Sync**: User metadata (Full Name, Mobile, Plan Status) is saved and synchronized with local cache via `AuthService`.
3. **Session Persistence**: JWT access tokens and refresh tokens are stored in hardware-encrypted storage (`SecureSupabaseStorage`), bypassing insecure plain text files.

### B. WhatsApp Web-Style Session Handoff (QR Code Login)
MoneyMapper implements a zero-password, real-time web session handoff similar to WhatsApp Web:

```
  ┌──────────────┐         1. Generates QR (UUID Token)         ┌──────────────┐
  │  React Web   ├─────────────────────────────────────────────►│  Supabase    │
  │   Frontend   │◄─────────────────────────────────────────────┤ Realtime DB  │
  └──────┬───────┘   4. Web receives JWTs & hydrates session    └──────▲───────┘
         │                                                             │
         │ 2. Scans QR Code                                            │ 3. Pushes JWTs
         ▼                                                             │    & Auth Status
  ┌──────────────┐                                                     │
  │ Mobile App   ├─────────────────────────────────────────────────────┘
  │ (Flutter)    │
  └──────────────┘
```

#### Protocol Sequence:
1. **Web App**: Generates a unique UUID `session_token`, inserts a `PENDING` record in `public.web_sessions`, and subscribes to Supabase Realtime updates on `session_token`.
2. **Mobile App**: User opens the built-in scanner (`QrScannerScreen`) from either **Personal Profile** or **Corporate Dashboard**.
3. **Scan Execution**: `ApiService.loginWithQr(token)` fetches the current session's `access_token` and `refresh_token` and updates `public.web_sessions`:
   ```json
   {
     "session_token": "<scanned_token>",
     "user_id": "<mobile_user_id>",
     "access_token": "<jwt_access_token>",
     "refresh_token": "<jwt_refresh_token>",
     "status": "AUTHENTICATED",
     "authenticated_at": "2026-09-06T23:00:00Z"
   }
   ```
4. **Web Hydration**: The Web app receives the Realtime `UPDATE` event, executes `supabase.auth.setSession({ access_token, refresh_token })`, deletes the temporary `web_sessions` row, and redirects to the web dashboard automatically.

---

## 🛡️ 3. Mobile Security & Anti-Fraud Hardening

MoneyMapper implements **Bank-Grade Mobile Hardening** across five key domains:

### A. Hardware-Encrypted Storage (`SecureSupabaseStorage`)
* Inherits from Supabase `LocalStorage`.
* Uses `FlutterSecureStorage` with `aOptions: AndroidOptions(encryptedSharedPreferences: true)` on Android and `KeychainAccessibility.first_unlock` on iOS.
* Encryption keys are managed directly by the **Android Keystore** and **Apple Keychain**.

### B. Network Security & SSL Certificate Pinning (`SecureNetworkClient`)
* Intercepts every outgoing HTTP request to inject `Authorization: Bearer <Supabase.instance.client.auth.currentSession.accessToken>`.
* If a request returns `401 Unauthorized`, a queued interceptor attempts an automatic session refresh via Supabase Auth and retries the failed request seamlessly.
* Enforces **SSL Certificate Pinning** on native platforms via `IOHttpClientAdapter` and `SecurityContext`, preventing Man-in-the-Middle (MitM) proxy attacks on public Wi-Fi.

### C. Screen Privacy & Anti-Spying (`FLAG_SECURE`)
* On Android, `MainActivity.kt` enforces `WindowManager.LayoutParams.FLAG_SECURE`.
* Screen recordings, screenshots, and task switcher previews are completely blocked/obscured.
* **Corporate Admin Bypass**: Admins defined in `public.corporate_admins` with `secure_flag = false` can toggle this off for live presentation demos.

### D. Code Obfuscation & R8 Scrambling (`proguard-rules.pro`)
* Release builds enforce `isMinifyEnabled = true` and `isShrinkResources = true` in `android/app/build.gradle.kts`.
* `proguard-rules.pro` scrambles classes, strips debugging metadata/line numbers, and repacks classes into `com.moneymapper.obscured`.
* Preserves critical reflection rules for Flutter Embeddings, Supabase, PostgREST, Dio, LocalAuth, and MobileScanner.

### E. Android 15 (API 35) 16 KB Page-Size Compatibility
* Compiled with `compileSdk = 35` and updated C++ native shared libraries (`mobile_scanner 6.0.11` / MLKit).
* Configured `useLegacyPackaging = true` in Gradle `packaging.jniLibs` and `android.bundle.enableUncompressedNativeLibs=false` in `gradle.properties` to ensure all native `.so` files are 16 KB page-size aligned (`0x4000` bytes).

---

## 📊 4. The 5 Core Financial Pillars & Scoring Engine

The Financial Fitness Score is calculated out of 100 based on weighted metrics across 5 pillars:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINANCIAL FITNESS SCORE (0 - 100)                        │
└─────┬──────────────┬───────────────┬────────────────┬──────────────┬────────┘
      │              │               │                │              │
┌─────▼─────┐  ┌─────▼─────┐   ┌─────▼─────┐    ┌─────▼─────┐  ┌─────▼─────┐
│  INCOME   │  │ EXPENSES  │   │ EMERGENCY │    │ INSURANCE │  │INVESTMENTS│
│ (20 Pts)  │  │ (20 Pts)  │   │ (20 Pts)  │    │ (20 Pts)  │  │ (20 Pts)  │
└───────────┘  └───────────┘   └───────────┘    └───────────┘  └───────────┘
```

### Pillar Definitions:
1. **Income Pillar Matrix (20 Pts)**: Evaluates multi-source income diversity, passive income ratio vs. active salary, and income stability index.
2. **Weekly Expense Predictor (20 Pts)**: Enforces the **50/30/20 Rule** (Needs, Wants, Savings). Evaluates weekly spending adherence, impulse control, and category targets.
3. **Emergency Readiness (20 Pts)**: Measures liquid cash availability against monthly fixed expenses. Ideal target is **6 months of expense runway**.
4. **Insurance Coverage Matrix (20 Pts)**: Evaluates Life Insurance (10x annual income target) and Health Insurance coverage gap based on Claim Settlement Ratio (CSR > 95%).
5. **Investment Asset Allocation (20 Pts)**: Analyzes portfolio risk appetite (Conservative, Moderate, Aggressive) across Equity, Debt, and Gold.

---

## 💳 5. Wealth Select Monetization & Subscription Stacking

MoneyMapper offers a premium tier (**Wealth Select Pro**) to unlock advanced screeners, full stock signals, and 24/7 AI advisory.

### A. Pricing Structure & Store Fee Offset
Google Play charges a ~15% platform fee. Pricing is adjusted to ensure net developer revenue while delivering consumer savings:

| Plan | Duration | Base Rate | Store Billed Upfront | Discount | Total Savings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quarterly** | 3 Months | ₹499/mo | **₹1,767** | 38% OFF | SAVE ₹897 |
| **Half-Yearly** | 6 Months | ₹399/mo | **₹2,814** | 50% OFF | SAVE ₹2,400 |
| **Yearly (Best Value)** | 12 Months | ₹299/mo | **₹4,188** | 63% OFF | SAVE ₹6,000 |

### B. Duration Stacking Algorithm (`stack_subscription`)
Users can purchase or extend subscriptions at any time without losing active days. The PostgreSQL RPC function calculates new expiration as follows:

$$\text{New Expiry} = \begin{cases} \text{NOW}() + \text{Duration}, & \text{if } \text{current\_expiry} \le \text{NOW}() \text{ or NULL} \\ \text{current\_expiry} + \text{Duration}, & \text{if } \text{current\_expiry} > \text{NOW}() \end{cases}$$

```sql
CREATE OR REPLACE FUNCTION public.stack_subscription(
    p_user_id UUID,
    p_months_to_add INT
) RETURNS void AS $$
DECLARE
    v_current_end TIMESTAMPTZ;
    v_new_end TIMESTAMPTZ;
BEGIN
    SELECT current_period_end INTO v_current_end
    FROM bse_data.user_subscriptions
    WHERE user_id = p_user_id;

    IF v_current_end IS NULL OR v_current_end <= NOW() THEN
        v_new_end := NOW() + (p_months_to_add || ' months')::INTERVAL;
    ELSE
        v_new_end := v_current_end + (p_months_to_add || ' months')::INTERVAL;
    END IF;

    INSERT INTO bse_data.user_subscriptions (user_id, tier, status, current_period_end, updated_at)
    VALUES (p_user_id, 'pro', 'active', v_new_end, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### C. Live Status Validation Protocol
* `PremiumService.syncSubscriptionStatus()` queries Supabase on app startup, auth state change, and pull-to-refresh.
* If a user is not present in `user_subscriptions` or `current_period_end < NOW()`, access instantly reverts to the **`BASIC`** free tier.

---

## 📈 6. Live Market Intelligence Engines

1. **24K Gold Rates (IBJA Scraper)**: Fetches live Indian Bullion and Jewellers Association rates from `bse_data.gold_rates` with local TTL caching.
2. **Nifty 500 Stock Signals**: Real-time signal engine (`bse_data.stock_signals`) classifying signals into `BUY`, `BEARISH/SELL`, or `WAIT`.
3. **Mutual Fund Screener**: Evaluates funds based on CAGR, Sharpe Ratio, Expense Ratio, and Alpha scores from `bse_data.mf_signals`.
4. **Screen-Aware Sentiment Gauge (`SentimentGauge`)**: Uses `ModalRoute.of(context).isCurrent` and `TickerMode` to run needle oscillation **only when visible**, pausing background rendering to maintain 60 FPS.

---

## 🏢 7. Corporate Workforce Health Index

MoneyMapper includes a specialized **B2B Corporate Wellness Module**:
* **Corporate Admin Access**: Controlled via `public.corporate_admins`.
* **Workforce Stability Index**: Aggregates anonymized employee emergency readiness, debt-to-income ratios, and financial stress scores.
* **Web QR Access**: Corporate admins can scan the Web QR code directly from `CorporateDashboardScreen` to view company analytics on a desktop monitor.

---

## 🗄️ 8. Complete Database Schema Reference

### Table: `bse_data.user_subscriptions`
```sql
CREATE TABLE bse_data.user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'expired',
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `public.web_sessions`
```sql
CREATE TABLE public.web_sessions (
    session_token VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    authenticated_at TIMESTAMPTZ
);
```

### Table: `public.corporate_admins`
```sql
CREATE TABLE public.corporate_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    secure_flag BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📂 9. Project Directory Structure

```
moneymapper_app/
├── android/                        # Android Native Project Configuration
│   ├── app/
│   │   ├── build.gradle.kts        # AGP 8.9.1, R8 Obfuscation & Legacy JNI Packaging
│   │   ├── proguard-rules.pro      # Production R8 Rules for Flutter & Supabase
│   │   └── src/main/kotlin/com/moneymapper/MainActivity.kt  # FLAG_SECURE & Play Integrity Channel
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties # Gradle 8.11.1
│   ├── gradle.properties           # JDK 21 Path & 16KB Page Alignment
│   └── settings.gradle.kts         # AGP & KGP Configuration
├── lib/
│   ├── chatbot/                    # AI Assistant Engine & Floating Mascot
│   │   ├── chat_intent_service.dart
│   │   ├── chat_message.dart
│   │   └── floating_chatbot.dart
│   ├── models/                     # Data Models
│   │   └── dashboard_model.dart
│   ├── screens/                    # Application Screens
│   │   ├── ai_assistant_screen.dart
│   │   ├── corporate_dashboard_screen.dart
│   │   ├── corporate_login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── insurance_screener_screen.dart
│   │   ├── main_screen.dart        # 4-Tab Navigation & Draggable Mascot
│   │   ├── master_data_screen.dart
│   │   ├── mf_screener_screen.dart
│   │   ├── profile_screen.dart
│   │   ├── qr_scanner_screen.dart  # Mobile QR Scanner Component
│   │   ├── recommendations_screen.dart
│   │   ├── stock_screener_screen.dart
│   │   └── subscription_screen.dart# Wealth Select Paywall Screen
│   ├── services/                   # Business Logic & Infrastructure Services
│   │   ├── api_service.dart        # Supabase API & Cache Interceptor
│   │   ├── auth_service.dart       # Supabase Auth & Local Profile Storage
│   │   ├── integrity_service.dart  # Play Integrity Attestation Service
│   │   ├── premium_service.dart    # Subscription Validation & Trial Sync
│   │   ├── secure_network_client.dart # Dio Client with SSL Pinning & JWT Interceptor
│   │   ├── secure_supabase_storage.dart # Keystore-backed LocalStorage
│   │   └── security_service.dart  # App Lock & Biometrics
│   ├── theme/                      # Theming & Design System
│   │   ├── app_theme.dart
│   │   ├── liquid_glass_theme.dart # macOS/iOS Glassmorphism System
│   │   └── responsive_utils.dart
│   ├── widgets/                    # Custom UI Components
│   │   ├── brand_logo.dart
│   │   ├── pillar_card.dart
│   │   ├── score_gauge.dart
│   │   └── sentiment_gauge.dart   # Screen-Aware Optimized Market Gauge
│   └── main.dart                   # Application Entry Point & Security Listeners
└── pubspec.yaml                    # Flutter Dependencies
```

---

## ⚡ 10. Local Development & Launch Instructions

### Prerequisites:
* Flutter SDK `3.24.x` or higher
* Java Development Kit (JDK) `17` or `21`
* Android Studio `2024.1+` / Xcode `15+`

### Execution Commands:

1. **Install Dependencies**:
   ```bash
   flutter pub get
   ```

2. **Run Static Analysis**:
   ```bash
   flutter analyze
   ```

3. **Launch Application on Connected Device / Emulator**:
   ```bash
   unset ANDROID_PREFS_ROOT && flutter run
   ```

4. **Build Release APK with R8 Scrambling**:
   ```bash
   unset ANDROID_PREFS_ROOT && flutter build apk --release
   ```

---

### 📄 License
Copyright © 2026 MoneyMapper Technologies. All rights reserved.
