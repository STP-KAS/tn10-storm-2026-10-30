# a12 — 2-hour run, same setup as a11, Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Why: a11 scored 9/10 (only criterion 3, landing 98.92 %, network floor). Same code and setup; only change is lane funding sized to the a11 burn (RUNBOOK 14).
- Config: tag s3a12, 4 families, rate 5, lanes desk/mini/muon/boson, `usable_min_tkas` desk 7,000 / mini 9,000 / muon 11,000 / boson 32,000. Family check 15:35Z, **START 15:45Z (16:45 CET), END 17:45Z (18:45 CET)**, RBF sweep END+75 s / 3 / 6 min, census 17:55Z, recovery to 18:05Z.
- Funding 14:59–15:06Z (`fund-lanes12.mjs`, 111 txs, fees 1.99 tKAS): desk 808 coins / 8,056 usable tKAS, mini 918 / 10,359, muon 1,028 / 12,660, boson 3,579 / 36,807.
- Mini: `mini-a8.ps1` (kit8) started 14:58Z, `PREFLIGHT_GENESIS exit=0` (3 coins ≥ 15 tKAS per genesis key). Mini kaspad untouched since the 11:10Z restart.
- Desk: `desk-a11.ps1` (kit10, pwsh 7, detached) started 14:58Z, clock +1.6 / +2.2 ms, `GUARD_PRE exit=2 refused=1` (refused before the handoff, as required).
- Pre-START census 15:06Z (`mempool-ro.mjs --save-pre`): desk 1 own (the a10 leftover with no live input), mini 0.

- **START 15:45:00Z** (`START senders=desk,mini,muon,boson families=4 rate=5`), after `HANDOFF ok`, `PREFLIGHT exit=0` (desk 8,056 / mini 10,359 / muon 12,660 / boson 36,807 usable tKAS, clock −1.8 ms) and `LAUNCH exit=0` at 15:35Z.
- **END 17:45:00Z**, `SENDERS_EXITED left=0` 17:45:03Z. Sweep END+75 s: desk 15 own (14 replaced, 1 no live input), mini 3 own (2 replaced, 1 no live input), 0 failed; END+3 and +6 min nothing left to replace. Census 17:55:07Z, `RECOVERY_DONE` 18:05Z on both. Nothing was stopped by hand; kaspad untouched on both machines (desk same process since 30 Oct 19:49Z, mini since 11:10Z).

## Result · scored Sat 31 Oct 2026, ~19:35 CET · **5/10**

`score.mjs` + `mempool-ours.jsonl`, logs copied read-only from desk and mini. Data: [data/](data/) (counts only, no ids).

| # | Criterion | Result | Numbers |
|---|---|---|---|
| 1 | Pre-checks (clock, sync, peers, disk) | PASS | desk clock +1.6 / +2.2 ms (14:58Z), −1.0 ms preflight, −2.2 ms after END; mini +31.4 ms (14:58Z), +25.5 ms after END (rule: within 100 ms); synced, 8 peers at preflight |
| 2 | Every lane every second | **FAIL** | desk 7,133 · mini 7,146 · muon 7,178 · boson 7,185 of 7,200 s. **Every missing second is inside the 3 network outages** (0 outside) |
| 3 | Landing ≥ 99 % of seconds | **FAIL** | **97.33 %** (7,008 / 7,200), 192 missed. Per 10 min: 8 1 43 49 29 10 2 3 5 17 9 16. 98 of them inside the outages (204 s); **outside the outages 98.66 %** (94 missed, 73 of 79 gaps single seconds, longest 5 s) |
| 4 | Non-contention errors ≤ 1 % | PASS | desk 0, mini 530 (0.39 %), muon 540 (0.41 %), boson 477 (0.35 %), all RPC timeouts in the outages. Contention: desk 97,181, mini 96,611, muon 95,171, boson 97,441 |
| 5 | Desk lane | **FAIL** | 0 errors, but attempts in 7,133 / 7,200 s (67 s off in the outages); share 12.04 % (reported) |
| 6 | Other lanes | **FAIL** | attempts mini 7,146, muon 7,178, boson 7,185 / 7,200 s; shares mini 4.32 %, muon 15.76 %, boson 67.89 % (reported) |
| 7 | Node RPC p95 < 50 ms, max < 250 ms | PASS | desk p95 2, max 42 ms; mini p95 2, max 8 ms. Sender RPC max ≈ 8,016 ms on mini/muon/boson (timeouts in the outages), desk 130 ms |
| 8 | Logs every 5 s | PASS | 1,438 / 1,437 rows in the window, max gap 5.018 / 5.045 s, 0 node-watch errors |
| 9 | 0 own tx at END + 10 min (new since START) | **FAIL** | 17:55:07Z: desk 1 own (0 new, 1 pre-START), mini 1 own (**1 new**, no live input, could not be swept). **New 1 · strict 2** |
| 10 | Handoff, guard, post-end, recount | PASS | `GUARD_PRE exit=2 refused=1`, `HANDOFF ok`, preflight 0, `RECOUNT_OK rows=4`, `RECOUNT_MATCH hoplog=38475 recount=38479 diff_pct=0.010` |

**Hops:** recount **38,479 = 5.34 hops/s** (f1 9,648 · f2 9,639 · f3 9,536 · f4 9,656); hop log 38,504 lines, 38,475 unique, 818 back-fill, 94 resync, 0 revert. Landed (non-back-fill) per 10 min (hops/s): 5.04 5.12 5.13 5.23 5.50 5.08 5.36 5.21 5.29 5.08 5.50 5.29.
**Freezes / stalls:** 0 `STALL`, 0 `PROC_EXIT`, 12 `SENDER_OFF reason=node_dead` (all 4 senders, 3 times), 208 `TIP_BACK`, 3,606 `UNACCEPT`. Longest all-family gap 37.2 s (16:16:30Z); per family 38.6–41.7 s at 16:14Z. **Mini kaspad did not freeze from memory** (working set 2.5–4.0 GB, free RAM ≥ 1.7 GB); desk kaspad 2.9–10.0 GB, free ≥ 3.6 GB.
**Pools (coins > 3 tKAS, start → min → end):** desk 808 → 554 → 575, mini 918 → 637 → 834, muon 1,028 → 745 → 760, boson 3,579 → 2,230 → 2,261. **0 `POOL_LOW`**: the a12 funding fix held.

### What failed and why
- **Three home-network outages (criteria 2, 3, 5, 6).** At 16:14:22Z, 16:16:29Z and 16:29:41Z the desk's network card (Intel I226-V) logged link down, up again after 16 / 9 / 10 s, and in the same second the mini logged lost internet (Windows NCSI), back after 13 / 10 / 10 s ([lan-events](data/lan-events-a12.csv)). Both nodes dropped to 0 peers and stopped advancing (DAA flat at the same values, `synced=0`), the public lanes muon and boson timed out from the desk, and every sender paused (`node_dead`) and came back by itself 10–35 s later. After each outage the DAA caught up at the normal ≈ 10/s, so **TN10 itself kept running; the outage was local** (shared LAN, router or uplink). Not kaspad, not our code. The desk event log shows the same link drops before: 4 on 29 Oct (around 01:30 CET), 11 on 30 Oct (12:11 to 23:16 CET, one of them 22:03 CET, the b2 mini peer loss), none in a8–a11.
- **Criterion 3 floor is still there without the outages:** 98.66 % outside them (a11 98.92 %). Same pattern: single empty seconds, spread out. With the current rule a 2-hour run at 4 families lands around 98.7–99.5 % (a7 99.28, a8 99.49, a9 99.32, a10 98.85, a11 98.92, a12 98.66 outside outages). **stp's decision** whether 99 % stays (no rule change made).
- **Criterion 9: 1 new own tx on the mini with no live input** (its input was already spent by a winning hop), so RBF cannot replace it; the strict count also has the old desk leftover. Most likely a race loser from the outage resync (not proven: the census logs counts only).

### What worked
- Lane funding sized to the a11 burn: 0 `POOL_LOW`, lowest pool 554 coins.
- Senders survived three network outages on their own (pause, resume, resync, back-fill 818 hops), recount matched to 0.010 %.
- No desk RPC spike, no mini memory freeze, RBF sweep replaced 16 of 18.
