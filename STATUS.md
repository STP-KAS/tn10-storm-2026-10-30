> Kaspa Testnet-10 only. Internal self-test, no Pulse. Running status, updated with each attempt.

# Status · 30 Oct 2026 · a6 scored 8/10 · a7 planned, not started

| Attempt | Score | hops/s | Main flaw |
|---|---|---|---|
| a4 | 6/10 | 4.09 | fade after 15 min (shared builder, walk pile-up) |
| a5 | 7/10 (8/10 under the 30 Oct RPC rule, record unchanged) | 2.93 | 3 families frozen on a phantom tip one hop ahead |
| a6 | **8/10** | **4.30** | desk clock −146 ms (needs admin); desk share 14.973 % (< 15 %, 3 hops short) |

a6 (15:00–15:30Z): no freeze. 3 phantom tips, each recovered in ~5.4 s. 843 `UNACCEPT`, 0 `STALL`. Landing seconds 99.22 %, node RPC p95 4 / 2 ms. `RECOUNT_OK rows=4` (7,732 vs hop log 7,734). [ATTEMPT-a6](logs/selftest-2026-10-30/step3-base/ATTEMPT-a6.md) · [REVIEW](logs/selftest-2026-10-30/step3-base/REVIEW.md)

## Open flaws and issues
- **Desk clock** −146.3 ms at a6 preflight, −154.0 ms after END, −157.2 ms at 16:00Z. w32time "syncs" with time.nist.gov but does not correct the offset. The fix needs admin on the desk (the agent session is not elevated). **Criterion 1 fails until stp runs the one-time admin fix** (commands in ATTEMPT-a6, a7 plan #1).
- **Desk lane share** 14.973 % (rule ≥ 15 %). Boson wins 67.7 % of the races, most likely because of its network position. Planned fix: fire-on-new-tip in `sender.mjs` plus `tip_age_ms` logging, rehearsed first. If that does not lift it, the share rule is stp's decision.
- **The hop log counts reverted hops** (+2 vs the recount in a6). The coordinator fix runs on the mini, so it goes to the mini bot.
- Guard refusal without a handoff was not shown again in a6 (the relaunch ran the guard after the handoff arrived).
- Mini node 24 libuv assert at exit after the wRPC disconnect (worked around by parsing preflight lines).
- Desk orchestrator must run under pwsh 7 (Windows PowerShell 5 died silently in the guard step).

## Fixed
- a6: tip step-back (proven under load: 3 of 3 phantom tips recovered), coordinator `UNACCEPT` + back probe, preflight clock gate (log mode) + genesis-key check, `proc-host-desk.csv`, broker `EPIPE`.
- After a6: `score.mjs` checks the share rule on the unrounded share (`share_exact_pct`, `share_pass`). a6 showed 15.0 for 14.973 %.

## Being done / next
1. **stp:** the admin clock fix on the desk (a7 plan #1). a7 cannot score 10/10 without it.
2. Desk: fire-on-new-tip + `tip_age_ms`, the guard-refusal pre-check and the pwsh check (`desk-a7.ps1`), then a 10 min rehearsal (pass: desk share ≥ 17 %).
3. Mini bot: hop-log revert marking + `seq` in `coordinator.mjs` (kit6).
4. a7 (same base). After the first 10/10: a **2-hour run of the same setup that must also score 10/10**, then 3× rate, then 8 families.
