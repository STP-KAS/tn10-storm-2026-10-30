> Kaspa Testnet-10 only. Internal self-test, no Pulse. Running status, updated with each attempt.

# Status · 30 Oct 2026 · a6 scored 8/10 · desk clock FIXED · share rule dropped (plan 2b, 18:06 CET) · **a7 SCORED 10/10** (5.32 hops/s) · **a8 (2 h) SCORED 7/10** (5.06 hops/s, boson lane ran out of coins)

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

## Paused — Fri 30 Oct 2026, 19:35 CET (18:35 UTC)

Testing is paused at stp's request: he is using the desk for gaming and will restart the desk and its node afterwards.

- a7 ran its full window (17:35–18:05 UTC) and recovery; its logs are on disk. **Scored 10/10 at ~19:50 CET** from logs copied read-only before the restart ([ATTEMPT-a7](logs/selftest-2026-10-30/step3-base/ATTEMPT-a7.md)).
- No sender, builder or coordinator is running. The 2-hour confirmation run has not started.
- The desk clock fix (NTP via pool.ntp.org, MaxAllowedPhaseOffset 0) should survive the restart. Re-check it in preflight.
- Resume order once the desk node is back and synced: score a7, then the 2-hour run if a7 is 10/10, otherwise a8. Top up the mini genesis keys before the next launch (see RUNBOOK).

## a7 scored — 30 Oct 2026, ~19:50 CET
- **10 / 10**, the first. 9,573 hops (recount) = 5.32 hops/s, 99.28 % landing seconds, 0 non-contention errors, desk clock +5.0 / −1.1 ms, node RPC max 16 ms (desk) / 35 ms (mini), `RECOUNT_OK rows=4`.
- New open flaws (measurement only): hop log misses 220 hops skipped by coordinator resyncs; `RECOUNT_OK` checks row count, not agreement. Fix both in the next kit.
- **Next: 2-hour 10/10 confirmation run of the a7 setup.** Not launched; testing is paused until stp says the desk node is back and synced. Before launch: top up mini genesis keys, explicit kit paths.

## b1 scored — 30 Oct 2026, ~21:05 CET
Box-only senders, mini counts, desk untouched: **6/10**. 6,035 hops (3.35 hops/s), 0 errors / 121,110 attempts, landing 92.0 %, RECOUNT_MATCH (6,038 vs 6,035). Held-awake segment 19:24:30–19:50Z: 3.56 hops/s, 97.65 % landing, every second on all lanes, **no freeze**. Detached keepalive alone did not stop the box suspend. Fails: clock (known), every-second (start lost to suspend), landing. Desk 2-hour confirmation of a7 still pending stp.

## b2 scored — 30 Oct 2026, ~22:30 CET
Box-only senders, mini counts, 20-min window 21:00–21:20Z **completed**: **7/10**. 4,333 hops (recount) = 3.61 hops/s, 0 errors / 86,220 attempts, every lane 1,200/1,200 s, landing 92.83 %. **0 box freezes** (health max gap 5.03 s, 20:37–21:24Z) even though the agent session holding the box was cut off. Reconnect fix proven in rehearsal (379 ms), not needed in the run. Fails: clock (known), landing and recount (mini kaspad lost all peers 21:03:19–21:04:14; hop log not back-filled after the resync: 4,028 vs 4,333). [ATTEMPT-b2](logs/selftest-2026-10-30/box-b2/ATTEMPT-b2.md)

## a8 running — 2-hour confirmation of a7 (started 31 Oct 2026, 00:47 CET)
stp is back from gaming and gave full control of the desk and mini. The box is not part of the run.
- Preflight: desk kaspad up and synced, desk clock **+0.7…+1.0 ms** (admin fix survived the reboot), mini synced via the tunnel (desk tunnel end restarted after the reboot).
- Mini genesis keys topped up to 4 coins each. The **boson lane key was down to 3 usable coins** (used by the box runs), caught by preflight in rehearsal 1 (safe abort); all lane keys topped up to 400.
- New in kit8: **hop-log back-fill** on resync and **`RECOUNT_MATCH`/`RECOUNT_DIFF`** (≤ 0.5 %). Rehearsal 2: `RECOUNT_MATCH` 1,833 vs 1,837 (0.22 %).
- **START 00:05Z (01:05 CET), END 02:05Z (03:05 CET)**, recovery to ~02:25Z. [ATTEMPT-a8](logs/selftest-2026-10-30/a8/ATTEMPT-a8.md)

## a8 scored — Sat 31 Oct 2026, ~03:45 CET
2-hour confirmation of a7 (00:05–02:05Z = 01:05–03:05 CET): **7/10, not passed**. Scaling stays blocked.
- **36,418 hops by recount = 5.06 hops/s** (f1 9,142 · f2 9,089 · f3 9,052 · f4 9,135). **`RECOUNT_OK rows=4`, `RECOUNT_MATCH hoplog=36415 recount=36418 diff_pct=0.008`** (kit8 back-fill works: 365 back-fill lines, 60 resyncs).
- Clean: 0 freezes/`STALL`/`PROC_EXIT`, 0 non-contention errors in 518,831 attempts, landing 99.49 %, node RPC p95 6 / 2 ms (max 17 / 26), clocks desk +4.2 / +4.5 ms, mini +8.8 / +17.1 ms, node-watch full window.
- **Fail 1+2 (criteria 2 and 6): boson lane funding pool ran dry** (first 0 coins 01:40:21Z): 39 seconds without a boson attempt (7,161 / 7,200), boson landed nothing after ~01:45Z, total fell to ≈ 4.4 hops/s for the last 20 min. Boson lands 56.6 % of hops, so it burns coins fastest (≈ 0.26 tKAS per landed hop, estimate). Fix: size lane funding to the run (boson ≥ 800 × 16 tKAS), `POOL_LOW` phase line, value-based preflight.
- **Fail 3 (criterion 9): mempool ≤ 5 not reachable**: desk 52–56, mini 676–726 after END, but the same levels were there before any sender started (since 23:06Z; a3–b2: 2–10). Identify those entries read-only; if foreign, the rule needs a dated change (stp's decision).
- Shares (reported): desk 12.35 · mini 5.43 · muon 25.60 · boson 56.63 %. [ATTEMPT-a8](logs/selftest-2026-10-30/a8/ATTEMPT-a8.md)
- **Next:** fix lane funding, settle the mempool rule, rerun the same 2-hour setup. Not launched.
