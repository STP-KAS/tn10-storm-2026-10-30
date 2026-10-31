> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a8 · 2-hour confirmation of the a7 setup · 4 families · rate 5 · 120 min · **SCORED 7/10**

Purpose: stp's rule — after the first 10/10 (a7), the same setup must also score 10/10 over **2 hours** before any scaling.
Same as a7: lanes desk, mini (tunnel), muon, boson; one builder per sender, catch-up cap 2 s, tip step-back, fire-on-new-tip, `clock_gate: fail` (80 ms), same 10 criteria (plan 2b, no share rule). The box is **not** part of the run.

Changes vs a7 (measurement only, mini side, kit8 = kit6 + 2 fixes):
1. **Hop-log back-fill** (`coordinator.mjs`): a resync that jumps from seq N to M now writes the skipped hops N+1…M−1 as `source:"backfill"` lines (seq, no txid, no accept time: those coins are spent) and the tip M as a `source:"resync"` hop. Every hop line carries `seq`. `score.mjs` counts back-fill hops (`hops_backfill`) but never uses them for landing seconds.
2. **Recount tolerance** (`recount.mjs`, `mini-a8.ps1`): after the recount, hop log (unique family+seq) vs recount; ≤ 0.5 % → `RECOUNT_MATCH`, else `RECOUNT_DIFF` (phase line + `logs/recount-check.txt`).
3. Run dirs from `mk-run8.ps1`; all kit paths passed explicitly (`-Kit/-Kit30/-Kit6`, `-Kit/-OldKit/-BuilderRoots`).

## Preflight (30 Oct, UTC)
| Time | Check | Result |
|---|---|---|
| 22:58 | desk kaspad running (since the desk restart), not touched | up |
| 22:58 | desk clock (`w32tm /stripchart`, 3 samples) | **+0.9 / +1.0 / +0.7 ms**; `MaxAllowedPhaseOffset` still 0 after the reboot, no re-fix needed |
| 22:59 | desk tunnel end restarted (the desk reboot had killed it; mini end was still dialing) | legs listening |
| 22:59 | desk node and mini node (via tunnel): `synced true`, testnet-10 | pass |
| 23:00 | mini genesis keys: 1 coin ≥ 15 tKAS each | topped up to **4 each** (1 tx, 12 × 20 tKAS, fee 0.0066 tKAS, Grok Bot TN10 wallet) |
| 23:13 | rehearsal 1 desk preflight: **boson lane key had 3 usable coins** (spent down by the box runs b1/b2) | `PREFLIGHT exit=20`, `LAUNCH_ABORT reason=preflight` (safe abort, no sender started) |
| 23:15–23:28 | lane top-up to 400 coins of 16 tKAS | boson +397, muon +11, mini +3 (11 txs, fees ≈ 0.12 tKAS); after: 400/400/400/400 |

## Rehearsal 2 (`reh8b`, 6 min, 23:36–23:42Z, same lanes, 4 families)
- Desk: guard refused before the handoff, `PREFLIGHT exit=0` (all lanes 400 coins, clock +1.1 ms), `LAUNCH exit=0`, `SENDERS_EXITED left=0`.
- Mini: 2 resyncs (f4 199→206, 355→362) → **12 back-fill + 2 resync hop lines** written.
- `RECOUNT_OK rows=4` and **`RECOUNT_MATCH hoplog=1833 recount=1837 diff_pct=0.218`** (a7 would have been 2.3 % off). 1,837 hops / 360 s = 5.10 hops/s.

## Launch
| | UTC | CET |
|---|---|---|
| orchestrators started (desk pwsh 7, mini detached) | 23:47 | 00:47 |
| genesis / family check | 23:57 | 00:57 |
| **START** | **00:05 (31 Oct)** | **01:05** |
| **END** | **02:05** | **03:05** |
| recovery + recount done | ~02:25 | ~03:25 |

Mini `PREFLIGHT_GENESIS exit=0`; desk `GUARD_PRE exit=2 refused=1` (refuses before the handoff, as required). 
Launch lines: mini `GENESIS` f1–f4 23:56:56–59Z, `HANDOFF ok` 23:56:59Z; desk `HANDOFF seen_on_desk` 23:57:02Z, `PREFLIGHT exit=0` (desk 400 coins 21 ms, mini 399 5 ms, muon 391 200 ms, boson 400 76 ms; **clock +4.4 ms, gate=fail, pass**), guard OK, `LAUNCH exit=0`. **START 00:05:00Z** on both. First 2 min: 617 hop lines in the hop log (≈ 5.1 hops/s), 2 normal `TIP_BACK` (f1 12→11, f4 76→75), no sender `.err` output, no `PROC_EXIT`.


## Result: **7 / 10** (2-hour confirmation **not** passed)
Scored Sat 31 Oct 2026 ~03:45 CET on the Grok Bot box (analysis only) with `tools/storm/score.mjs` (kit8, `SHARE_LANES` empty = plan 2b). Both orchestrators had finished on their own (desk `RECOVERY_DONE` 02:25:10Z, mini `RECOVERY_DONE` 02:25:11Z). The logs were zipped read-only on the desk and the mini and copied to the box. No process was started or stopped, and kaspad was not touched.

**36,418 hops by recount = 5.06 hops/s over 7,200 s** (a7 5.32 over 30 min). Per family f1 9,142 · f2 9,089 · f3 9,052 · f4 9,135 = 1.270 · 1.262 · 1.257 · 1.269 hops/s. Hop log: 36,429 lines, 36,415 unique family+seq (36,004 coordinator + 60 resync + 365 back-fill), 0 revert lines. **`RECOUNT_OK rows=4` and `RECOUNT_MATCH hoplog=36415 recount=36418 diff_pct=0.008 tol_pct=0.5`** (02:25:11Z, unattended). The kit8 back-fill closed the a7 hop-log gap (a7: 2.3 %, a8: 0.008 %).

No family froze: 0 `STALL`, 0 `PROC_EXIT`, 0 `SENDER_OFF`/`NODE_SKIP`/`NODE_DROP`, all four sender `.err` files empty, `SENDERS_EXITED left=0`. 13 coordinator `TIP_BACK`, 151 sender `TIP_BACK` lines (all `why=timeouts`, each recovered at once), 3,842 `UNACCEPT`, 60 resyncs (all back-filled). Longest gap between any landed hops 1.82 s. Longest per family 15.83 s (f1 00:37:28Z) · 6.76 · 6.95 · 6.27 s.

| # | Criterion | Result | Key number |
|---|---|---|---|
| 1 | Pre-checks: synced, peers ≥ 8, clock within 100 ms, disk ≥ 100 GB | **PASS** | desk clock **−1.7 / −1.5 ms** (23:47Z), **+4.2 ms** at preflight, **+4.5 ms** after END; mini **+8.8 ms** (23:47Z), **+17.1 ms** after END. Both synced the whole window, 8 peers at preflight. Free disk desk 434 GB, mini 310 GB (read ~03:40 CET). Report only: peers dipped to 7 in 23 desk samples (00:42:57–00:43:22, 01:25:31–01:25:51, 01:54:28–01:54:53Z, 02:17Z after END) and 5 mini samples (02:00:57, 02:05:12–02:05:27Z) |
| 2 | Every lane ≥ 1 attempt in each of 7,200 s | **FAIL** | desk 7,200 · mini 7,200 · muon 7,200 · **boson 7,161** / 7,200: 39 single seconds with no boson attempt between 01:42:21Z and 02:03:46Z (boson funding pool empty, see below) |
| 3 | Hops land in ≥ 99 % of seconds | **PASS** | **99.49 %** (7,163 / 7,200, from the hop log). Missed per 10 min: 4 · 4 · 4 · 6 · 2 · 4 · 0 · 4 · 2 · 2 · 3 · 2 |
| 4 | Every reject is contention; non-contention ≤ 1 % per lane | **PASS** | 0 non-contention on all four lanes (518,831 attempts) |
| 5 | Desk lane: attempts every second + non-contention ≤ 1 % (plan 2b; share reported) | **PASS** | 7,200 s, 0 errors. Share **12.35 %** (4,453 / 36,064) |
| 6 | mini, muon, boson: attempts every second + non-contention ≤ 1 % (shares reported) | **FAIL** | mini and muon 7,200 s, 0 errors. **boson 7,161 s** (0 errors). Shares mini 5.43 · muon 25.60 · boson 56.63 % |
| 7 | Node RPC p95 < 50 ms and max < 250 ms per node | **PASS** | desk p95 **6**, max **17** ms; mini p95 **2**, max **26** ms (node-watch, 1,438 rows each in the window) |
| 8 | Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch 1,438 rows each in the window (5.00x s period), max gap 5.02 / 5.05 s, first row 3.7 / 1.2 s after START, last 0.6 / 2.1 s before END. Post-end mempool 240 rows each, node-watch ran to 02:25Z |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **FAIL (by the rule as written)** | desk mempool **52–56** for the whole recovery (53 at 0 s after END), mini **676–726** (680 at 0 s, 676 most samples). The run left nothing behind: these levels were there **before any sender started** (desk 53, mini 673 at 23:47Z; desk 52, mini 673 since rehearsal reh8 at 23:06Z) and stayed flat through the window (desk 52–114, mini 672–741). In a3–b2 both nodes sat at 2–10. The ≤ 5 rule cannot be met with this background, see Fix 2 |
| 10 | 29 Oct items: handoff, guard, post-end, all lanes together, after-END recount | **PASS** | handoff sha256 ok 23:56:59Z, seen on desk 23:57:02Z (3 s after the last genesis); guard **refused before the handoff** (`GUARD_PRE exit=2 refused=1`, 23:47:06Z), then `GUARD OK` 23:57:03Z; all lanes from 00:05:00Z; post-end ran on both; **`RECOUNT_OK rows=4` + `RECOUNT_MATCH` 0.008 %** |

### Lanes (window 00:05:00–02:05:00Z)
| Lane | Attempts | ok | contention | non-cont. | Landed | Share | sender rpc_ms p95 / max | tip age p50 |
|---|---|---|---|---|---|---|---|---|
| desk | 137,785 | 37,529 | 100,256 | 0 | 4,453 | 12.35 % | 1 / 28 | 222 ms |
| mini | 137,580 | 37,475 | 100,105 | 0 | 1,958 | 5.43 % | 44 / 300 | 236 ms |
| muon | 131,843 | 33,732 | 98,111 | 0 | 9,231 | 25.60 % | 128 / 484 | 306 ms |
| boson | 111,623 | 30,580 | 81,043 | 0 | 20,422 | 56.63 % | 29 / 1,094 | 284 ms |

Throughput per 10 min (family seq advance, all families): 5.25 · 5.06 · 5.05 · 5.12 · 5.40 · 5.33 · 5.33 · 5.24 · 5.24 · **4.88 · 4.36 · 4.44** hops/s. Landed per lane per 10 min (boson): 1,597 · 1,646 · 1,758 · 1,939 · 2,363 · 2,364 · 2,460 · 2,529 · 2,479 · 1,287 · **0 · 0**. Boson attempts per 10 min: ≈ 11,440 until 01:35Z, then 6,491 · 1,087 · 1,088.

### What failed and why: boson lane ran out of funding coins (criteria 2 and 6)
- `pool-boson.csv` (usable coins > 3 tKAS on the boson lane key, every 5 s): 400 at preflight, ≈ 295 at 01:15Z, then a steady fall: 253 (01:25), 194 (01:30), 111 (01:35), 28 (01:38), **first 0 at 01:40:21Z**, 0–3 until END. [data/pool-boson-a8.csv](data/pool-boson-a8.csv)
- Cause: every landed hop spends one funding coin and returns smaller change; a coin leaves the pool once its change is ≤ 3 tKAS (`Pool.refresh` filter). Boson wins most races (56.6 %), so it spends coins fastest: ≈ 19,800 boson hops landed before 01:40Z on 400 coins of 16 tKAS, i.e. **≈ 0.26 tKAS of lane funds per landed hop** (derived estimate: 400 × (16 − 3) / 19,800; not measured per tx). The preflight floor checks the coin **count** (≥ 200) at start, not whether the lane's funds last the window.
- Effect: with an empty pool `sender.mjs` skips the attempt without a log row, so 39 boson seconds had no attempt. Boson landed nothing after ~01:45Z, and total throughput fell from ≈ 5.2 to ≈ 4.4 hops/s for the last 20 min. The other lanes picked up the races (landing seconds stayed ≥ 99 %, no freeze).
- The other lanes also trended down over the 2 hours: lowest pool desk 281, mini 238, **muon 166** (below the 200 preflight floor by END). Part of each count is coins in flight (every lane's count saw-tooths by ≈ 100 roughly every 40 min), so the per-hop figure is approximate; boson's fall to 0 is not a saw-tooth (it never came back). At 3× rate every lane would run dry.

### Flaws found (no criterion)
1. Peers dipped to 7 for ~25 s at a time (desk 3× in the window, mini 1× in the window). No effect on RPC or landing seconds.
2. The node-watch `err` column holds a stray CR (`\r`) on every row (CSV line ending), which looks like an error to naive parsers. Cosmetic.
3. f1 had a 15.8 s gap between landed hops at 00:37:28Z (other lanes kept landing hops on other families; no `STALL`).

### Fixes for the next run
1. **Lane funding sized to the run, not to a coin count.** Before a 2-hour run, top up every lane key to cover its expected landed hops × ≈ 0.26 tKAS with margin: boson (≈ 57 % of ≈ 36,400 hops ≈ 20,700 hops ≈ 5,400 tKAS) → at least **800 coins of 16 tKAS** or 400 of 32 tKAS; muon ≥ 600 × 16; desk/mini 400 × 16 is enough at rate 5. Add a `POOL_LOW lane=… coins=…` phase line in `sender.mjs` below 100 coins and a preflight check of the lane's usable **value** (Σ(amount − 3 tKAS) ≥ expected hops × 0.3 tKAS). For 3× rate, multiply by 3. Rehearse before the rerun.
2. **Mempool baseline (criterion 9).** Find what the 52 (desk) / ~675 (mini) entries are (a read-only `getMempoolEntries` count, ours vs foreign) before the next run. If they are foreign TN10 background, the rule needs a dated change (e.g. "mempool ≤ pre-run baseline + 5"): **stp's decision**, not changed here. If they are ours (e.g. old box-run/top-up txs), wait for them to clear, then launch.
3. Re-run the **same 2-hour a8 setup** with Fix 1 (and Fix 2 decided). Scaling stays blocked until a 2-hour 10/10.
