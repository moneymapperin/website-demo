# MASTER RULES

MASTER RULES (apply to every task in this project, remember them):
1. Source of truth = Flutter code in reference/. Before writing any data code, grep the Flutter files (lib/services/api_service.dart, auth_service.dart, lib/models/*, the screens) and copy exact names. If something is ambiguous or missing, STOP and ask me. Do not guess.
2. Never edit anything inside reference/. Never put a Supabase service_role key in the website. Only the anon key, via env vars.
3. Do NOT change existing landing page sections or design unless the task says so.
4. After EVERY task: (a) write unit tests for what you built, (b) run `npm run test` and `npm run build` (tsc must pass), (c) if anything fails, fix it and re-run until everything is green, (d) finish with a report: files changed, tests added, pass/fail counts, and anything you could NOT verify (for example things that need the real Supabase database). Do not start the next task on your own.
5. Tests must be honest: no `expect(true)`, no skipped tests, and never delete or weaken a failing test to make it pass.
6. At the start of every task, re-read docs/MASTER_RULES.md, docs/SCHEMA_CONTRACT.md and docs/APP_FEATURE_MAP.md.
