> Kaspa Testnet-10 only. Internal self-test, no Pulse. Running status, updated with each attempt.

# Status · 30 Oct 2026 · a6 scored 8/10 · desk clock FIXED · share rule dropped (plan 2b, 18:06 CET) · **a7 RUNNING 17:35–18:05Z**

**[RUNBOOK](RUNBOOK.md)**: every problem a1–a7, how it was solved, and the launch checklist.

| Attempt | Score | hops/s | Main flaw |
|---|---|---|---|
| a4 | 6/10 | 4.09 | fade after 15 min (shared builder, walk pile-up) |
| a5 | 7/10 (8/10 under the 30 Oct RPC rule, record unchanged) | 2.93 | 3 families frozen on a phantom tip one hop ahead |
| a6 | **8/10** | **4.30** | desk clock −146 ms (needs admin); desk share 14.973 % (< 15 %, 3 hops short) |

a6 (15:00–15:30Z): no freeze. 3 phantom tips, each recovered in ~5.4 s. 843 `UNACCEPT`, 0 `STALL`. Landing seconds 99.22 %, node RPC p95 4 / 2 ms. `RECOUNT_OK rows=4` (7,732 vs hop log 7,734). [ATTEMPT-a6](logs/selftest-2026-10-30/step3-base/ATTEMPT-a6.md) · [REVIEW](logs/selftest-2026-10-30/step3-base/REVIEW.md)

## Open flaws and issues
- ~~**Desk lane share**~~ resolved by the plan 2b criteria change (18:06 CET). a7 rehearsal 16:55–17:05Z ([REHEARSAL-a7](logs/selftest-2026-10-30/step3-base/REHEARSAL-a7.md)): fire-on-new-tip makes the desk fire first (tip age p50 221 ms) and its node accepts as many submits as boson's, but only 13 % of them land vs 76 % for boson. Share **13.191 %** (< 17 % gate). The winner is set after submit by propagation to the miners, so code cannot fix it. **stp's decision (plan 2b)**: score the desk lane like the others, or keep the rule.
- ~~**Desk clock** −146.3 ms at a6 preflight, −154.0 ms after END, −157.2 ms at 16:00Z. w32time "syncs" with time.nist.gov but does not correct the offset. The fix needs admin on the desk (the agent session is not elevated). ~~ **FIXED 30 Oct 2026, 16:45–16:47Z by stp (admin)**: NTP peer `pool.ntp.org,0x8`, manual sync, SpecialPollInterval 900, **MaxAllowedPhaseOffset 0** (the key step: Windows only steps the clock above 300 s by default), restart w32time, resync /force. Readings: −0.162 s at 16:46Z (before MaxAllowedPhaseOffset), **+0.0008 / +0.0004 / +0.0004 s at 16:47:50Z**, rehearsal preflight +2.0 ms at 16:54Z. a7 config: `clock_gate: fail`. Commands in [RUNBOOK](RUNBOOK.md) 6.5.
- **Desk lane share** 14.973 % (rule ≥ 15 %). Boson wins 67.7 % of the races, most likely because of its network position. Planned fix: fire-on-new-tip in `sender.mjs` plus `tip_age_ms` logging, rehearsed first. If that does not lift it, the share rule is stp's decision.
- **The hop log counts reverted hops** (+2 vs the recount in a6). The coordinator fix runs on the mini, so it goes to the mini bot.
- Guard refusal without a handoff was not shown again in a6 (the relaunch ran the guard after the handoff arrived).
- Mini node 24 libuv assert at exit after the wRPC disconnect (worked around by parsing preflight lines).
- Desk orchestrator must run under pwsh 7 (Windows PowerShell 5 died silently in the guard step).

## Fixed
- a6: tip step-back (proven under load: 3 of 3 phantom tips recovered), coordinator `UNACCEPT` + back probe, preflight clock gate (log mode) + genesis-key check, `proc-host-desk.csv`, broker `EPIPE`.
- After a6: `score.mjs` checks the share rule on the unrounded share (`share_exact_pct`, `share_pass`). a6 showed 15.0 for 14.973 %.

## Being done / next
1. ~~stp: admin clock fix~~ done.
2. ~~Desk: fire-on-new-tip + `tip_age_ms` (`sender.mjs`), guard-refusal hard pre-check + pwsh 7 check (`desk-a7.ps1`), 10 min rehearsal~~ done: rehearsal FAIL on the share gate (13.19 %).
2b. ~~share rule~~ decided 18:06 CET (plan 2b, dated in PLAN): desk scored like the others, all shares reported.
2c. **a7 running** ([ATTEMPT-a7](logs/selftest-2026-10-30/step3-base/ATTEMPT-a7.md)): START 17:35:00Z, END 18:05:00Z, recovery to 18:25Z. First 2 min clean: all 4 lanes 120/120 s, 0 errors, ≈ 5.3 hops/s.
3. Mini bot: hop-log revert marking + `seq` in `coordinator.mjs` (kit6).
4. a7 (same base). After the first 10/10: a **2-hour run of the same setup that must also score 10/10**, then 3× rate, then 8 families.
