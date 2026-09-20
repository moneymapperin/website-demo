# Mobile QR Scanner & Navigation Diagnostic Report

> **Target**: `reference/moneymapper_app/lib/screens/qr_scanner_screen.dart` & related mobile navigation/API calls.  
> **Investigation Scope**: Post-scan async execution, navigation target, camera stream lifecycle, error handling, and route history.  
> **Status**: DIAGNOSTIC ONLY. No source code modified.

---

## Root-Cause Hypothesis

The mobile app's QR scanner functions as an **authorization companion** rather than a primary login screen: it was opened via `Navigator.pushNamed(context, '/qr_scanner')` from either `ProfileScreen` or `CorporateDashboardScreen` by a user who is **already authenticated on mobile**. When `loginWithQr(token)` successfully upserts the mobile user's JWT tokens into `public.web_sessions`, the scanner executes `Navigator.pop(context)` preceded by a success SnackBar. This correctly pops the scanner modal off the stack and returns the user to the screen they were just on (`ProfileScreen` or `CorporateDashboardScreen`), rather than routing to `HomeScreen` or `MainScreen`. If the user or tester expects the mobile app to navigate to "Home", this is an architectural misunderstanding of companion authorization (like WhatsApp Web/Discord QR linking). However, a genuine technical defect exists in the camera lifecycle: `MobileScannerController` is never stopped upon detection (`controller.stop()` is missing), and `_handleScan` is fired unawaited from `onDetect`. If an upsert fails, `_isProcessing = false` immediately causes continuous re-scanning of the same QR code at 30fps, spamming API requests.

---

## Detailed Itemized Diagnosis (Items 1 to 8)

### 1. Post-Scan Async Execution Sequence & Supabase Await
- **Question**: What exact sequence of async calls happens? Barcode detected → `_handleScan(code)` → `ApiService`? Does it await Supabase `upsert()` and check/await the result?
- **Finding**:
  1. **Camera Detection** ([`lib/screens/qr_scanner_screen.dart:42-53`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L42-L53)):
     ```dart
     onDetect: (capture) async {
       if (_isProcessing) return;
       final List<Barcode> barcodes = capture.barcodes;
       for (final barcode in barcodes) {
         final String? code = barcode.rawValue;
         if (code != null) {
           setState(() => _isProcessing = true);
           _handleScan(code);
           break;
         }
       }
     }
     ```
  2. **Scan Handler** ([`lib/screens/qr_scanner_screen.dart:85-110`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L85-L110)):
     ```dart
     Future<void> _handleScan(String token) async {
       try {
         await _api.loginWithQr(token);
         if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(
               content: Text('Web Login Successful! 🎉'),
               backgroundColor: AppColors.success,
               behavior: SnackBarBehavior.floating,
             ),
           );
           Navigator.pop(context);
         }
       } catch (e) { ... }
     }
     ```
  3. **API Service Call** ([`lib/services/api_service.dart:610-629`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/services/api_service.dart#L610-L629)):
     ```dart
     Future<void> loginWithQr(String token) async {
       try {
         final session = _supabase.auth.currentSession;
         final userId = _auth.currentUserId;
         if (session == null || userId == null) throw ApiException('Not Logged In', 401);

         await _supabase.from('web_sessions').upsert({
           'session_token': token,
           'user_id': userId,
           'access_token': session.accessToken,
           'refresh_token': session.refreshToken,
           'status': 'AUTHENTICATED',
           'authenticated_at': DateTime.now().toIso8601String(),
         }, onConflict: 'session_token');

       } catch (e) {
         _logErrorResilient(e, "loginWithQr");
         throw ApiException("Web Login Failed. Please try again.", 500);
       }
     }
     ```
  - **Analysis**:
    - The Supabase `.upsert(...)` call **is** strictly awaited in `ApiService.loginWithQr`.
    - In `supabase_flutter`, PostgREST queries throw a `PostgrestException` if an error occurs (such as RLS denial, network loss, or schema mismatch).
    - If `upsert()` throws, `loginWithQr` catches it and rethrows `ApiException("Web Login Failed. Please try again.", 500)`.
    - `_handleScan` awaits `_api.loginWithQr(token)` inside a `try` block. Only after that `await` completes without throwing does code proceed to the success UI and navigation.
- **Classification**: **OK** (Calls are properly sequenced and awaited before success handling).

---

### 2. SnackBar Placement Relative to Navigation
- **Question**: Is there a success SnackBar/dialog shown BEFORE or AFTER the navigation call? Quote the exact code block.
- **Finding**:
  [`lib/screens/qr_scanner_screen.dart:88-97`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L88-L97):
  ```dart
  if (mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Web Login Successful! 🎉'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Navigator.pop(context);
  }
  ```
  - `ScaffoldMessenger.of(context).showSnackBar(...)` is called **BEFORE** `Navigator.pop(context)`.
  - Because `ScaffoldMessenger` is managed by the root `MaterialApp`, the floating SnackBar is scheduled immediately, and then `Navigator.pop(context)` dismisses the camera screen on the very next line.
  - The SnackBar remains visible floating at the bottom of the underlying parent screen (`ProfileScreen` or `CorporateDashboardScreen`).
- **Classification**: **OK** (Standard Flutter pattern for displaying notifications while closing modals/sub-routes).

---

### 3. Destination of the Post-Success Navigator Call
- **Question**: Is there an actual Navigator call after success — `Navigator.pop(context)`, `Navigator.pushReplacement`, or similar to `MainScreen`/`HomeScreen`? If yes, quote it exactly. If no such call exists at all, say so explicitly.
- **Finding**:
  [`lib/screens/qr_scanner_screen.dart:96`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L96):
  ```dart
  Navigator.pop(context);
  ```
  - **There is NO call to `MainScreen` or `HomeScreen`**.
  - There is no `Navigator.pushReplacementNamed(context, '/main')`, `Navigator.pushNamedAndRemoveUntil`, or similar.
  - The code **strictly executes `Navigator.pop(context)`**, returning to whatever route pushed `/qr_scanner`.
- **Classification**: **CONFIRMED BUG** (If the intended UX was to send the mobile app back to `MainScreen`/Home after web login; otherwise **OK** if intentional companion modal dismissal).

---

### 4. Continuous Scanning, Debounce Guards & Controller Lifecycle
- **Question**: Is `onDetect` firing MULTIPLE times for the same QR code? Is `controller.stop()` or a debounce guard called immediately on first detect?
- **Finding**:
  [`lib/screens/qr_scanner_screen.dart:41-53`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L41-L53):
  ```dart
  MobileScanner(
    onDetect: (capture) async {
      if (_isProcessing) return;
      final List<Barcode> barcodes = capture.barcodes;
      for (final barcode in barcodes) {
        final String? code = barcode.rawValue;
        if (code != null) {
          setState(() => _isProcessing = true);
          _handleScan(code);
          break;
        }
      }
    },
  ),
  ```
  - **Debounce / Processing Guard**: `_isProcessing` is set synchronously (`setState(() => _isProcessing = true)`) before `_handleScan(code)` begins. Lines 43 (`if (_isProcessing) return;`) successfully prevents subsequent frames from triggering `_handleScan` while the initial scan is in flight.
  - **Missing Controller & Camera Stream**:
    - `MobileScannerController` is **NEVER** created or controlled (`controller.stop()` is nowhere in the file).
    - The underlying camera platform texture continues streaming video frames in the background even while the `'Authenticating...'` spinner overlay is displayed.
  - **Error Re-Scan Loop Hazard** ([`lib/screens/qr_scanner_screen.dart:107`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L107)):
    - If `loginWithQr` fails, line 107 executes `setState(() => _isProcessing = false)`.
    - If the user has not physically pointed the camera away from the computer screen, `MobileScanner.onDetect` immediately detects the exact same QR code again on the very next frame, triggering an infinite burst of failing network requests.
- **Classification**: **CONFIRMED BUG** (`controller.stop()` is missing, and resetting `_isProcessing = false` on failure causes an immediate camera re-scan loop).

---

### 5. Mounted Guard Check
- **Question**: Is the navigation wrapped in a `mounted` check before calling `Navigator` after the async upsert completes?
- **Finding**:
  [`lib/screens/qr_scanner_screen.dart:88, 99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L88):
  ```dart
  Future<void> _handleScan(String token) async {
    try {
      await _api.loginWithQr(token);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(...);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ...
      }
    }
  }
  ```
  - Both the success navigation block and the error catch block are explicitly wrapped in `if (mounted)`.
  - If the user taps the AppBar back button while the upsert is in flight, `mounted` evaluates to `false` and `Navigator.pop(context)` is safely bypassed.
- **Classification**: **OK** (`if (mounted)` check is properly implemented).

---

### 6. Error Handling & Optimistic Success Verification
- **Question**: Does a failed upsert incorrectly show "success"? Is the success UI shown optimistically before checking the upsert's response?
- **Finding**:
  - `ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Web Login Successful! 🎉'), ...))` is positioned strictly after `await _api.loginWithQr(token);`.
  - If the upsert fails (e.g. Supabase RLS error 403, network disconnect, or 401 unauthenticated mobile session), `_supabase.from('web_sessions').upsert(...)` throws, `ApiService.loginWithQr` rethrows an `ApiException`, and control transfers to the `catch (e)` block ([`lib/screens/qr_scanner_screen.dart:98-109`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L98-L109)).
  - The danger SnackBar with `e.toString()` is displayed, and `Navigator.pop(context)` is **never** invoked.
- **Classification**: **OK** (Success UI is strictly conditional on successful upsert completion; never displayed optimistically).

---

### 7. Originating Routes & Pop Behavior
- **Question**: Was this scanner screen opened via `Navigator.push` from Profile/Corporate Dashboard? Does "navigate home" actually mean popping back to that screen?
- **Finding**:
  1. **Profile Screen** ([`lib/screens/profile_screen.dart:689`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/profile_screen.dart#L689)):
     ```dart
     _buildSettingTile(
       icon: Icons.qr_code_scanner,
       title: "Web Login via QR Scanner",
       subtitle: "Scan web QR to instantly authenticate",
       onTap: () {
         Navigator.pushNamed(context, '/qr_scanner');
       },
     )
     ```
  2. **Corporate Dashboard Screen** ([`lib/screens/corporate_dashboard_screen.dart:149`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/corporate_dashboard_screen.dart#L149)):
     ```dart
     if (val == 'qr_web') Navigator.pushNamed(context, '/qr_scanner');
     ```
  - Both caller screens open `QrScannerScreen` as a push route on top of the active view.
  - When `QrScannerScreen` calls `Navigator.pop(context)`, it pops itself and returns the user to **Profile** or **Corporate Dashboard**.
  - Because mobile users accessing Profile or Corporate Dashboard are already signed in to their account, this behavior is standard companion authentication (authorizing the desktop device and returning to the mobile settings menu).
  - If a tester expected scanning to navigate the phone to "Home", this explains why the phone stays on Profile.
- **Classification**: **OK** (Working as designed for a companion scanner), but **SUSPECTED** source of user confusion regarding "doesn't go home".

---

### 8. Git History & Recent Changes on `qr_scanner_screen.dart`
- **Question**: Compare against last known-working version in git history if recently touched.
- **Finding**:
  - Git log confirms `reference/moneymapper_app/lib/screens/qr_scanner_screen.dart` was introduced in commit `431efeec9ba68960097bde6f3d5065cfd5bbd547` ("Updated website").
  - There are no prior git revisions of `qr_scanner_screen.dart` in this repository; the current 111-line implementation is the initial committed version.
- **Classification**: **OK** (No regression from past git revisions; file has remained unchanged since commit `431efee`).

---

## Summary of Diagnostic Items

| # | Inspection Item | Classification | Key Citation |
|---|---|---|---|
| **1** | Sequence of Async Calls & Await | **OK** | `qr_scanner_screen.dart:87`, `api_service.dart:616` |
| **2** | SnackBar Before Navigation | **OK** | `qr_scanner_screen.dart:89-96` |
| **3** | Navigation Destination (`pop` vs Home) | **CONFIRMED BUG** *(if Home required)* / **OK** *(if modal dismiss)* | `qr_scanner_screen.dart:96` (`Navigator.pop(context)`) |
| **4** | Continuous Scan & Camera Lifecycle | **CONFIRMED BUG** | `qr_scanner_screen.dart:41-53, 107` (No `controller.stop()`, re-scan loop on error) |
| **5** | Mounted Guard Check | **OK** | `qr_scanner_screen.dart:88, 99` |
| **6** | Error Handling & Optimism | **OK** | `qr_scanner_screen.dart:98-109` |
| **7** | Route Stack Origin (Profile/Corporate) | **SUSPECTED** *(Origin of user confusion)* | `profile_screen.dart:689`, `corporate_dashboard_screen.dart:149` |
| **8** | Git History & Regressions | **OK** | Introduced in commit `431efee` |
