# 🎯 MoneyMapper — Production Technical Specification & System Architecture

MoneyMapper is an enterprise-grade, cross-platform financial health scoring, intelligence, and wealth advisory platform built for the Indian market. It is engineered using modern frameworks including Flutter for fluid UI rendering, Supabase for realtime database management, Deno Edge Functions for serverless compute, and bank-grade mobile security standards.

---

## 📌 Executive Summary

MoneyMapper takes a holistic approach to personal finance by evaluating a user's complete financial profile across **5 Financial Pillars**: Income, Expenses, Emergency Readiness, Insurance Coverage, and Asset Allocation. It synthesizes these inputs to compute a dynamic **Financial Fitness Score (0–100)**. 

Beyond scoring, the platform delivers live market intelligence (such as IBJA 24K Gold rates, Nifty 500 stock signals, and Mutual Fund screeners), an interactive AI advisory assistant, WhatsApp Web-style QR session handoffs for desktop access, and a highly resilient Serverless Payment Engine capable of dynamic failover routing.

---

## 🏗️ 1. Technical System Architecture

MoneyMapper follows a **Decoupled Service-Oriented Architecture (SOA)**, ensuring strict separation of concerns across the platform while enabling real-time edge processing.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (UI)                            │
│  Responsive Viewports │ Liquid Glassmorphism (iOS) │ Material 3 (Android)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            APPLICATION & DOMAIN                             │
│       Value-First Onboarding │ Stateful Controllers │ Realtime Syncer       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         SECURITY & SERVICE LAYER                            │
│  Secure Network Pipeline │ Hardware-Encrypted Storage │ Identity Verification│
└──────────────────────────┬─────────────────────────┬──────────────┬─────────┘
                           │                         │              │
┌──────────────────────────▼──────────┐   ┌──────────▼─────┐   ┌────▼─────────┐
│     EXTERNAL BACKEND (SUPABASE)     │   │ SECURE VAULT   │   │ DENO EDGE    │
│  PostgreSQL 15+  │  Row Level Sec.  │   │ Android/iOS Env│   │ API Routing  │
└─────────────────────────────────────┘   └────────────────┘   └──────────────┘
```

### Architectural Sub-Systems
*   **Presentation Layer**: Implements a truly adaptive UI that responds natively to the host operating system. It utilizes rich native iOS Glassmorphism (respecting system-level accessibility constraints like "Reduce Transparency") and smooth Material 3 animations on Android. Foldable and Tablet devices automatically transition from a standard bottom navigation bar to a responsive "Floating Nav Island."
*   **Data Synchronization Engine**: Leverages Supabase Realtime (WebSockets) to instantly push database mutations to the client, coupled with a dual-tiered local cache (10-minute short TTL for profile data, 4-hour long TTL for market intelligence) to guarantee zero-latency rendering.
*   **Security & Network Pipeline**: Powered by a robust HTTP client featuring automatic JWT token interception, hardware-encrypted local storage, and explicit Row Level Security (RLS) enforcement on all database queries.
*   **Identity & Auth Fabric**: Manages user identity via Supabase Authentication (Email/Metadata/Google OAuth via ASWebAuthenticationSession), alongside a PostgreSQL relational database protected by granular security policies and server-side Remote Procedure Calls (RPCs).

---

## 🚀 2. Core Platform Features & Engineering

### A. WhatsApp Web-Style Session Handoff (QR Code Login)
MoneyMapper implements a zero-password, real-time web session handoff, allowing users to securely port their mobile session to a desktop monitor for deeper financial analysis.
*   **The Protocol:** The web client generates a unique UUID `session_token` and subscribes to it via Supabase Realtime. The user scans the QR code using the mobile app's built-in `mobile_scanner`.
*   **Secure Hydration:** The mobile device executes a secure backend RPC, injecting its encrypted JWT Access and Refresh tokens into the matching database row. The WebSocket instantly wakes up the web client, hydrates the browser's local storage with the tokens, deletes the temporary row, and authorizes the user in under 400 milliseconds.

### B. Live Market Intelligence Screeners
The platform acts as a comprehensive wealth terminal, featuring specialized engines that parse raw market data into actionable insights:
*   **Nifty 500 Stock Signals**: A real-time signal engine classifying algorithmic indicators into `BUY`, `BEARISH/SELL`, or `WAIT` statuses for major Indian equities.
*   **Mutual Fund Screener**: Evaluates thousands of funds based on critical metrics including Compound Annual Growth Rate (CAGR), Sharpe Ratio, Expense Ratio, and Alpha generation.
*   **Insurance Screener**: Compares life and health insurance policies using dynamic Claim Settlement Ratios (CSR) and age-adjusted premium modeling to locate coverage gaps.
*   **Screen-Aware Sentiment Gauge**: Uses viewport tracking to run heavy physics-based needle oscillation (rendering market sentiment indices) **only when physically visible on the screen**, pausing background rendering to maintain a strict 60 FPS across the app.

### C. Jitter Elimination & Intelligent State Preservation
All primary navigation tabs (Dashboard, Insights, AI Assistant, Profile) are bound to the framework's KeepAlive engine. The UI state is preserved indefinitely in the device's memory when a user navigates between tabs, ensuring 0-millisecond layout recreation and perfectly smooth screen transitions.

---

## 💳 3. Payment Processing & Dynamic Gateway Fallback

MoneyMapper features a highly resilient **Serverless Checkout Engine** designed to eliminate single points of failure during the critical payment checkout process.

### A. Dynamic Priority Routing (Strategy Pattern)
The payment edge function dynamically evaluates the operational status of configured gateways (such as Cashfree or Federal Bank/Easebuzz) at runtime:
*   **Primary Gateway:** The system attempts to route the transaction through the highest-priority provider.
*   **Silent Fallback:** If the primary SDK crashes, returns a 500 server error, or is unauthorized due to merchant account issues, the serverless `try/catch` block **instantly and silently switches to the secondary backup gateway**. It generates a new cryptographic payload and hands the fallback token back to the mobile app. The user experiences a seamless checkout without ever seeing a crash or error screen.

### B. Secure Server-to-Server Verification
*   Payment payloads are cryptographically signed using `SHA-512` hashing directly on the secure Edge node. The merchant secret salts *never* touch the user's mobile device.
*   **Transaction Finalization:** The mobile application NEVER updates payment success statuses directly. Instead, it triggers a highly restricted Remote Procedure Call (RPC) on the backend. This RPC executes with elevated `SECURITY DEFINER` privileges to securely verify the transaction with the bank before granting the user premium access, effectively blocking any client-side spoofing or referral code abuse.

---

## 📊 4. The 5 Core Financial Pillars & Scoring Engine

The platform's proprietary Financial Fitness Score is calculated out of 100, based on weighted metrics across 5 distinct pillars:

1.  **Income Pillar Matrix (20 Pts)**: Evaluates multi-source income diversity, passive income ratio versus active salary, and a localized income stability index based on the user's city tier.
2.  **Weekly Expense Predictor (20 Pts)**: Enforces the industry-standard **50/30/20 Rule**. It evaluates weekly spending adherence, impulse control metrics, and category targets.
3.  **Emergency Readiness (20 Pts)**: Measures liquid cash availability against monthly fixed expenses, targeting an ideal **6 months of expense runway**.
4.  **Insurance Coverage Matrix (20 Pts)**: Evaluates Life Insurance coverage (targeting 10x annual income) and Health Insurance gaps based on Claim Settlement Ratios (CSR > 95%).
5.  **Investment Asset Allocation (20 Pts)**: Analyzes the user's portfolio risk appetite across Equity, Debt, and Gold assets.

---

## 🔐 5. Security Posture & Data Privacy Compliance

MoneyMapper is engineered to comply with the most stringent global privacy laws, including the **GDPR** and India's **Digital Personal Data Protection (DPDP) Act**. 

### A. Value-First Onboarding (Progressive Profiling)
MoneyMapper flips the traditional, friction-heavy registration flow to maximize trust and conversion:
*   **Anonymous Lead Engine**: New users input their financial data (Income, EMI, etc.) into an interactive wizard *before* ever providing a password. This data is securely stored in a restricted holding area.
*   **Instant Value**: The backend instantly calculates their Financial Fitness Score and Stability Status (e.g., Red/Yellow/Green debt-to-income ratios) and presents a personalized "Teaser Dashboard."
*   **Frictionless Conversion**: Only after seeing the value of the platform is the user prompted to secure their account with a password. The system then seamlessly merges their anonymous session into a fully authenticated cryptographic identity without requiring them to re-type any information.

### B. The "Right to be Forgotten" (Data Deletion Architecture)
MoneyMapper provides a legally compliant, user-driven data deletion pipeline:
*   Users can initiate a formal data deletion request directly from their Profile screen.
*   **Delay & Verification Mechanism:** To prevent accidental data loss or malicious account hijacking, deletions are scheduled for **7 days** in the future. 
*   **Secure Withdrawal Window:** During this 7-day window, the user can withdraw their request. This withdrawal triggers a hard-delete (`delete()`) command against their request ticket in the database.
*   **Row Level Security (RLS):** Every step of the deletion and withdrawal process is cryptographically verified by Supabase RLS policies. A user can only view, initiate, or cancel a deletion request if their secure JWT token (`auth.uid()`) perfectly matches the database record. Once the 7-day window expires, the backend automatically cascades the deletion, permanently and irreversibly purging all PII (Personally Identifiable Information) and financial records from the platform.

### C. Hardened Mobile Security
*   **SSL Certificate Pinning:** The application enforces strict SSL pinning, ensuring that the mobile app will only communicate with the genuine backend servers, completely neutralizing Man-in-the-Middle (MitM) interception attempts on public Wi-Fi networks.
*   **Hardware-Backed Storage:** All sensitive session tokens are vaulted using Android's `EncryptedSharedPreferences` and the iOS `Keychain`, relying on the physical security chips inside the user's device rather than software-level plain text files.
*   **Screen Privacy:** On supported Android devices, the app utilizes `FLAG_SECURE` to block screenshots, screen recording, and obscure the app's content in the OS multitasking view, ensuring financial data cannot be inadvertently leaked or spied upon.
