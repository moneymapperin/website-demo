# Corporate Intelligence Specification (`/corporate-dashboard`)

This document specifies the architecture, data contracts, privacy rules, and mobile-to-web deviations for the B2B Corporate Dashboard in MoneyMapper Web.

---

## 1. Overview & Route Architecture

- **Route**: `/corporate-dashboard`
- **Aliases**: `/corporate/dashboard` $\to$ redirects to `/corporate-dashboard`.
- **Guarding**: Wrapped in `CorporateGuard`:
  - Fetches admin record via `apiService.getCorporateAdmin(email)`.
  - **Admin Authenticated**: Renders corporate intelligence portal.
  - **Non-Admin (Null response or missing email)**: Dispatches toast *"Standard Account Detected: Corporate intelligence is restricted to authorized corporate administrators."* and redirects to `/dashboard`.
  - **Verification Error (Network/RLS failure)**: Renders error alert with a **Retry Verification** button; does **NOT** treat error as non-admin or redirect.
  - **Loading**: Displays animated spinner while verifying credentials.

---

## 2. Omitted Fabricated / Hardcoded Modules & Deviations

In `reference/moneymapper_app/lib/screens/corporate_dashboard_screen.dart`, several modules display static constants or artificial formulas rather than real telemetry from the company's workforce:

> [!NOTE]
> *"These numbers are constants in the mobile app, not derived from company data; re-enable when the backend provides real fields."*

### Detailed Audit of Omissions:

| Module | Mobile Implementation | Web Behavior | Rationale |
| :--- | :--- | :--- | :--- |
| **Stress Module** | Hardcoded `Expense Pressure 65/100`, `EMI Load Index 42/100` | **OMITTED** | Constant for every single company in Flutter; provides zero real intelligence. |
| **ROI Module** | Hardcoded `+12.4% Estimated` productivity gain, `+6.8% Projected` retention lift | **OMITTED** | Fabricated figures hardcoded in Flutter; misleading to enterprise buyers. |
| **Recommendations** | Static strings: *"Increase insurance coverage for employees aged 30+."* & *"Launch department-specific SIP education."* | **OMITTED** | Hardcoded static list in Flutter; not generated from analytics data. |
| **AI Stability Forecast** | LineChart spots computed as `score * [0.9, 0.95, 1, 1.05, 1.1, 1.15]` | **OMITTED** | Artificial synthetic multiplier array rather than true AI predictive model output. |
| **Critical Outcomes Severity Tags** | Fixed tags `"High Risk"` and `"Fragile"` hardcoded next to Paycheck Dependency & Emergency Fund Gap | **Rendered as Value Only** | In Flutter, tags are displayed even if percentages are low (e.g. 5%). Web renders `"{pct}%"` and `"Affects {pct}% of staff."` without misleading fixed severity labels. |

---

## 3. Calculation Logic & Approximations

### Pillar Hit-Rates ("Workforce Intelligence")
- **Approximation Note**: In the mobile app, pillar hit counts are calculated as:
  $$\text{hits} = \text{round}\left(\frac{\text{avg\_score}}{100} \times \text{headcount}\right)$$
  This is a mathematical **approximation** derived from the company-wide average score, **not** a true count of individual employees who reached a "Stable" threshold.
- **Labeling**: To maintain transparency, meters are explicitly labeled **"Estimated employees"**.

### Risk Distribution
- Metrics queried directly from `core.corporate_analytics`:
  - `stable_count`
  - `watchlist_count`
  - `high_risk_count`
  - `critical_risk_count`
- Rendered as linear progress bars relative to `total_headcount`.

---

## 4. Department Heatmap & Privacy Anonymization

- **Source**: `stats.dept_metrics` map: `{ [dept_name]: { avg_stress: number, headcount: number } }`.
- **Stress Threshold**:
  - `stress > 65` $\to$ **HIGH RISK** (red).
  - `stress <= 65` $\to$ **STABLE** (green).
  - (Note: 65% is Stable, 66% is High Risk, exactly matching mobile).
- **Privacy Anonymization (`MIN_COHORT_SIZE`)**:
  - Constant: `export const MIN_COHORT_SIZE = 5;`
  - Any department with `headcount < MIN_COHORT_SIZE` is **hidden** from the dashboard.
  - Notice displayed: *"Departments with fewer than 5 employees are hidden to protect anonymity."*
  - Setting `MIN_COHORT_SIZE = 0` completely restores the mobile app's unfiltered view.
- **Empty State**: If no departments qualify or data is empty, displays: *"No departmental data yet."*

---

## 5. Caching & Data Refresh Policy

- **Service**: Reuses `apiService.getCorporateWorkforceStats()`.
- **Cache Key**: `corp_stats_<userId>`.
- **TTL**: `TTL_MEDIUM_MS = 60 * 60 * 1000` (1 hour, matching mobile app's `_ttlMedium`).
- **Cache Busting / Refresh**:
  - The **Refresh** button in the corporate header invokes `apiService.clearCache(['corp_stats_' + user.id])` and initiates an immediate network refetch.
- **Missing Data Fallback**:
  - If no row exists in `core.corporate_analytics`, returns fallback object:
    `{ company_name, avg_workforce_score: 0, total_headcount: 0 }`.
  - When `total_headcount === 0`, renders the warning banner:
    *"NO DATA — Registered employee signals needed."*

---

## 6. UI & Experience Specifications

- **Intro Sequence**:
  - Rotating 5 problem statements every 1.0s.
  - Progress bar incrementing every 320ms to 100%.
  - Web scan panel text: *"Use the mobile app QR scanner to sign in on other devices"*.
  - *"Continue to Dashboard"* button allowing users to skip directly to analytics.
  - Auto-transitions to dashboard after 5.2s.
- **Corporate Header**:
  - Organization name from `stats.company_name`.
  - Admin avatar initial (uppercase first letter of email).
  - Actions: Refresh Dashboard, Web QR Info modal, Theme toggle (Light/Dark), Logout Session with confirmation modal.
- **Privacy Banner**:
  - Shield icon + *"Privacy-First: All signals are anonymized and aggregated."*
