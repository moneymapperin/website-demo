# Weekly Tracker Technical Specification (`/weekly`)

> **Source of Truth**: Flutter mobile implementation in `reference/moneymapper_app/lib/weekly_expense_tracker.dart` alongside `screens/weekly_screen.dart`, `services/streak_service.dart`, `services/xp_service.dart`, and `services/api_service.dart`.

---

## 1. Architectural Overview & Flutter Legacy Analysis

### Legacy Screen (`screens/weekly_screen.dart`)
In the Flutter mobile repository, `screens/weekly_screen.dart` represents a legacy implementation:
1. **Incompatible Data Path**: It attempts to read response fields (`id`, `income`, `fixed_expenses`, `week_no`, `target_*_min/max`, `*_achieved`, `discipline_score`) directly from `apiService.getWeeklyCurrent()`. However, `apiService.getWeeklyCurrent()` in `lib/services/api_service.dart` queries `public.weekly_logs` and returns `{ 'data': [weekly_logs rows] }`.
2. **Dead Scoring Logic**: Its 45% Fixed / 35% Flexible / 20% Savings 100-based weighted scoring formula and `submitRedGreen()` call are legacy artifacts; `submitRedGreen()` only busts the local cache and does not persist structured logs.

### Active Working Logic (`weekly_expense_tracker.dart`)
The authoritative business logic is implemented in `reference/moneymapper_app/lib/weekly_expense_tracker.dart`:
- Uses the **Sunday-start dynamic calendar week model** (4, 5, or 6 weeks per month).
- Target ranges derived from `monthlyActiveIncome / 4` and `expense_pillar_score` midpoints.
- Category score formulas: Fixed (15 base + 20 range), Flexible (15 base + 20 range), Savings (10 base + 20 range).
- Disciplinary score = sum of the 3 category scores (max 100).
- Persists via `apiService.updateWeeklyStatus` to `public.weekly_logs` with 12 exact columns.

### Web Architecture
The Web application `/weekly` adopts the visual layout from `weekly_screen.dart` (gradient header, streak counter, week tabs, concentric rings, stat card, habit heatmap, income card, targets list, Fin observation card, submit button) powered by the authoritative business logic from `weekly_expense_tracker.dart`. All business logic is encapsulated in `src/models/weekly.ts` and the `useWeeklyTracker` hook so Task 12 (`/pillars/expenses`) can reuse it without code duplication.

---

## 2. Deviations & Web Design Choices

1. **No Month/Year Selector**:
   - In Flutter, the weekly tracker always binds to the current calendar month and year (`DateTime.now().month`, `DateTime.now().year`). The web implementation retains this clean, focused header without arbitrary month navigation.
2. **Real-Log Driven Habit Heatmap**:
   - Flutter `weekly_screen.dart` used hardcoded modulo fake data (`i % 5 == 0`, `i % 3 == 0`) across 28 arbitrary cells.
   - On web, the heatmap renders the actual days of the current month. Each day maps to its Sunday-start week, and its color reflects the real status from `weekly_logs`:
     - Achieved week $\to$ Optimal (`#10B981` / Success green)
     - Missed week $\to$ Missed (`#EF4444` / Danger red)
     - Active current week without submission $\to$ Safe / Accent (`#6366F1` / Indigo)
     - Future or unlogged past days $\to$ Inactive neutral background.
3. **Avoidance of Flutter's Zero-Score Quirk**:
   - In `weekly_expense_tracker.dart`, `local_expense_score` was written to `SharedPreferences` on every load and week switch via `_updateViewDecisions() -> _calculateLocalDisciplineScore()`. As a consequence, merely opening an undecided week wrote a score of `0`, inadvertently zeroing the user's dashboard expenses pillar.
   - **Web Rule**: `local_expense_score` is written to `gamificationStore` **ONLY** when the user marks a target decision (Done/Missed) or submits the weekly report. Opening `/weekly` or switching weeks never overwrites the score.
4. **Device-Local Storage**:
   - `streak_count_weekly`, `last_action_week_v2`, `last_action_year_v2`, `last_streak_bonus_week`, `user_total_xp`, and `local_expense_score` are stored in `gamificationStore` (device-local `localStorage`), matching Flutter's use of `SharedPreferences`.
5. **Push Notifications**:
   - `NotificationService.scheduleWeeklyReminders()` is mobile-only (`flutter_local_notifications`) and is **N/A on web**.
6. **Reloaded Submitted Week Base Scores**:
   - When a submitted week is reloaded, Flutter initializes base scores only (15 for Fixed achieved, 15 for Flexible achieved, 10 for Savings achieved, 0 for missed) because individual category spent amounts are not re-evaluated locally. The web model mirrors this exact behavior.

---

## 3. Database & Persistence Contract

### Table: `public.weekly_logs`
All database operations use **1-based `week_index`** (`i + 1`):

#### Read: `apiService.getWeeklyCurrent({ month, year })`
- Filter: `user_id = auth.uid()`, `log_month = currentMonth`, `log_year = currentYear`.
- Order: `week_index ASC`.

#### Write: `apiService.updateWeeklyStatus(...)`
- Exact 12 columns upserted:
  1. `user_id` (string)
  2. `week_index` (integer, 1-based: 1, 2, 3, ...)
  3. `log_month` (integer, 1..12)
  4. `log_year` (integer, e.g. 2026)
  5. `status` ('achieved' | 'missed')
  6. `fixed_status` ('achieved' | 'missed' | undefined)
  7. `flexible_status` ('achieved' | 'missed' | undefined)
  8. `savings_status` ('achieved' | 'missed' | undefined)
  9. `spent_fixed` (number)
  10. `spent_flexible` (number)
  11. `spent_savings` (number)
  12. `updated_at` (ISO timestamp string)
- Conflict target: `'user_id,week_index,log_month,log_year'`.

---

## 4. Date & Calendar Math

- **Sunday-Start Month**:
  - `firstDay = new Date(year, month - 1, 1)`
  - `daysToSubtract = firstDay.getDay() === 0 ? 0 : firstDay.getDay()` (Sunday is 0 in JS).
  - `monthStart = new Date(year, month - 1, 1 - daysToSubtract)`.
- **Dynamic Week Count**:
  - `lastDayOfMonth = new Date(year, month, 0)`.
  - Day difference computed safely with UTC:
    `diffDays = Math.round((Date.UTC(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate()) - Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate())) / 86400000) + 1`.
    `weekCount = Math.ceil(diffDays / 7)`.
- **Lifecycle & Locking Rules**:
  - `isPast = now.getTime() > weekEnd.getTime() + 23 * 3600 * 1000 + 59 * 60 * 1000`.
  - `isFuture = now.getTime() < weekStart.getTime()`.
  - `isCurrent = !isPast && !isFuture`.
  - `is_locked = isFuture || (isPast && !hasLog)`.
  - `is_submitted = hasLog !== undefined`.
- **Overall Status**:
  - `'achieved'` if and only if `fixed_status === 'achieved' && flexible_status === 'achieved' && savings_status === 'achieved'`.
  - Otherwise `'missed'`.

---

## 5. Gamification (Streak & XP)

### ISO-8601 Week Number Calculation
Matches Dart `intl` `_getWeekNumber`:
- Weekday: `getDay() === 0 ? 7 : getDay()` (Monday = 1 ... Sunday = 7).
- Day of year `1..366`.
- `weekNumber = Math.floor((dayOfYear - weekday + 10) / 7)`.
- If `weekNumber < 1`: recursively compute for Dec 31 of prior year.
- If `weekNumber > 52`: check Dec 31 of current year; if `weekday < 4` (Thursday), returns 1, otherwise week 53 stays. (In 2026, Dec 31 is a Thursday, yielding 53 weeks).

### Streak State Machine
- First action $\to$ 1
- Same week action $\to$ no-op (streak unchanged)
- Consecutive week action $\to$ increment streak (`streak + 1`)
- Grace week (skip exactly 1 week) $\to$ increment streak (`streak + 1`)
- Missed 2+ weeks $\to$ reset to 1
- Inactivity check: `_checkAndResetStreak` resets streak to 0 if opened after skipping more than 1 week.
- Streak milestone: when streak $\ge 4$, awards +150 XP bonus at most once per week.
- Weekly check-in: awards +50 XP.
