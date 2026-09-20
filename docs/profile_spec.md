# MoneyMapper Profile & Gamification Specification (Web)

This document details the Profile tab (`/profile`), gamification achievements (`/achievements`), referral system (`/referral`), and privacy compliance (`/privacy`), documenting all platform adaptations and intentional deviations from the Flutter mobile reference.

---

## 1. Feature Map & Source Mapping

| Web Route / Component | Flutter Mobile Source | Description & Implementation Notes |
| :--- | :--- | :--- |
| `/profile` (`ProfilePage`) | `profile_screen.dart` | User header, subscription card, gamified milestones, security preferences, support & FAQs, export, and logout. |
| `/achievements` (`AchievementsPage`) | `achievements_screen.dart`, `xp_service.dart` | 5 milestone badges with full titles, descriptions, unlock tags, XP, and streak overview. |
| `/referral` (`ReferralPage`) | `referral_screen.dart` | Code generation `MM<SUFFIX>`, clipboard copy, and WhatsApp share link. |
| `/privacy` (`PrivacyPolicyPage`) | `privacy_policy_screen.dart`, `assets/privacy_policy.html` | Strict DOMPurify sanitization and responsive reader view. |
| `exportService.ts` | `_exportData()` in `profile_screen.dart` | Real CSV & JSON profile export with Excel UTF-8 BOM and formula injection protection. |
| `badgeService.ts` | `_checkBadges()` in `dashboard_screen.dart` | Table-driven badge criteria evaluation and XP reward logic. |

---

## 2. Intentional Platform Adaptations & Deviations

### 2.1 Financial Profile Export (New Real Feature)
- **Mobile Reality**: In Flutter `profile_screen.dart` lines 437-445, tapping "Export Now" merely dismisses the dialog and shows a SnackBar (`"Financial profile exported to downloads folder."`) without generating or saving any file.
- **Web Implementation**: Web implements a real client-side export utility (`src/services/exportService.ts`):
  - Fetches fresh profile JSON via `apiService.getMasterProfile()`.
  - **CSV**: One header row containing master profile keys, one value row formatted per RFC 4180 with a UTF-8 Byte Order Mark (`\uFEFF`) so Excel opens it with proper encoding.
  - **Formula Injection Guard**: Any cell starting with `=`, `+`, `-`, `@`, `\t` (tab), or `\r` is escaped by prefixing with a single quote `'` (OWASP CSV Injection Defense).
  - **JSON**: Developer backup using pretty-printed JSON (`JSON.stringify(data, null, 2)`).
  - **Filenames**: `moneymapper_profile_YYYY-MM-DD.csv` and `moneymapper_profile_YYYY-MM-DD.json`.
  - **Privacy Notice**: Displays a prominent warning in the modal: *"This file contains personal data such as PAN, date of birth and policy details. Keep it safe."*
  - **Security Filter**: Explicitly omits all authentication tokens, session tokens, passwords, or plan variables from exported files.
  - **Feedback**: Success toast appears only after the file download is successfully triggered.

### 2.2 Rate MoneyMapper Feedback
- **Mobile Reality**: In Flutter `profile_screen.dart`, user feedback submitted in the rating dialog is discarded and only shows a toast.
- **Web Implementation**: Tapping Submit on web opens a prefilled mailto link to `mailto:info@moneymapper.in?subject=MoneyMapper%20feedback%20({n}%2F5)&body={encodedText}` allowing users to actually deliver their rating and qualitative feedback to the team, followed by the confirmation toast *"Thank you for your feedback!"*.

### 2.3 Referral Audit Bonus Text Omission
- **Mobile Reality**: Flutter `referral_screen.dart` displays the text *"Your friends get a free financial audit when they join using your code."*
- **Web Adaptation**: Because no referral verification, redemption mechanism, or signup code input exists anywhere in the backend schemas (`public.master_profiles`, `public.web_sessions`) or auth handlers, this promise cannot be fulfilled. It is omitted on web to prevent misleading users.

### 2.4 Trust Badges: Omission of "SEBI CERTIFIED"
- **Mobile Reality**: `profile_screen.dart` lines 997-1000 display two trust badges: `SSL SECURED` and `SEBI CERTIFIED`.
- **Web Adaptation**: Because MoneyMapper humAIn IQ is an algorithmic financial health tool and SEBI certification is a regulated statutory credential that has not been verified for this domain/organization, displaying "SEBI CERTIFIED" poses regulatory liability. The web application renders only `SSL SECURED`. The inclusion of "SEBI CERTIFIED" is flagged as pending product owner confirmation.

### 2.5 Badge Logic: `debt_free` Strictness
- **Mobile Reality**: In `dashboard_screen.dart` line 1206:
  ```dart
  final loans = profile['activeLoans']?.toString() ?? '0';
  if (loans == '0' || loans.isEmpty) {
    await _xpService.rewardBadge('debt_free');
  }
  ```
  This automatically rewarded `debt_free` to users who never completed or skipped their financial profile, because missing `activeLoans` defaulted to `'0'`.
- **Web Adaptation**: On web, `debt_free` is awarded only when `activeLoans` is explicitly present in the fresh master profile and numerically equal to `0`. Blank, null, or missing keys do not trigger the badge.

### 2.6 Mobile-Only Preferences Disabled on Web
- In accordance with `docs/APP_FEATURE_MAP.md`, `App Lock` (device biometric authentication) and `Weekly Reminders` (local push notification cron) are native mobile operating system features.
- On web, these tiles are displayed disabled with an explicit badge: `"Available in the mobile app"`.

### 2.7 Device-Local Gamification Persistence
- In Flutter, gamification XP, levels, streak counters, and unlocked badge IDs are stored in device-local `SharedPreferences`.
- On web, these values are stored in browser-local `localStorage` via `src/services/gamificationStore.ts`.
