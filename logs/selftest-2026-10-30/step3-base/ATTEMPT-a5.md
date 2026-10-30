> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a5 · 4 families · rate 5/family · 13:20:00–13:50:00 UTC

**a5 ended cleanly but FAILS (7/10 criteria).** The a4 fade fix worked for the families that kept running: family 1 landed 319–337 hops every 5 minutes for the whole 30 minutes, the builders stayed fast (build p95 4–6 ms in every 5 min) and no queue built up. But a **new failure mode stopped three of the four families for good**: family 3 at 13:24:30, family 4 at 13:38:39 and family 2 at 13:48:04. Each time the senders and the coordinator were left holding a tip **one hop ahead of the live chain tip**, and the a5 code only ever moves a tip forward, so it never recovered (details in "What didn't", 1). Total **5,278 hops = 2.93 hops/s** (a4: 4.09). Hops landed in **96.61 %** of seconds (a4: 94.33 %). Three criteria fail: landing seconds (< 99 %), the desk **clock at −119.1 ms** (limit 100 ms), and one desk node-watch RPC sample of **97 ms** (limit < 50 ms).

Desk: `START` 13:20:00Z, `END reason=window` 13:50:00Z, `SENDERS_EXITED left=0` 13:50:03Z, `RECOVERY_DONE` 14:10:10Z. Mini: coordinator `STOP reason=END` 13:50:00Z, `END` 13:50:03Z, `RECOUNT` 13:51:03Z, **`RECOUNT_OK rows=4`** 14:10:10Z, `RECOVERY_DONE` 14:10:10Z.

Genesis 13:07:56–59Z (launch paths `…-s3a5-f1..4`). Lane keys topped up from the Grok Bot TN10 wallet to **400 coins of 16 tKAS each** (8 txs, 0.14 tKAS fees) before preflight.

## Launch fix (before START)

**First try aborted before START (12:54:55Z):** the mini coordinator dropped all 4 families with `FAMILY_DROP reason=no_funding`, because the mini's four *genesis* keys (separate from the desk lane keys) had no coin of 15 tKAS or more left after a4. The handoff push then failed as designed (`http_422_not_handoff`, empty handoff), and the desk guard never let a sender start. Fix: 3 coins of 16 tKAS per genesis key from the Grok Bot wallet (1 tx), both orchestrators stopped and relaunched with genesis at 13:08Z and START at 13:20Z. **For every later run:** preflight must also check that each genesis key has at least 1 coin of 15 tKAS or more.

## Score against the PLAN criteria (option (a) share rule, see [PLAN](../../../plan/PLAN.md))
| # | Criterion | Result | Key number |
|---|---|---|---|
| 1 | Step 1 pre-checks: synced, peers ≥ 8, **clock within 100 ms**, disk ≥ 100 GB | **FAIL (clock)** | desk clock **−119.1 ms** at launch (13:08:03Z), −132.9 ms after END. Mini +11.8 / +13.4 ms. Synced 1 and 8 peers on both at START. Free disk 436 GB desk, 313 GB mini (measured at 14:23 UTC, after the run; not logged before START) |
| 2 | Every lane ≥ 1 attempt in each of 1,800 s | **PASS** | desk, mini, muon, boson: 1,800 / 1,800 each |
| 3 | Hops land in ≥ 99 % of seconds | **FAIL** | **96.61 %** (1,739 / 1,800). Missed per 5 min: 3 · 3 · 5 · 7 · 20 · 23; all 61 are single seconds |
| 4 | Every reject is contention; non-contention ≤ 1 % per lane (pre-submit errors included) | **PASS** | desk 0 · mini 0 · muon 24 / 33,960 (0.07 %, WebSocket drop 13:26:10.231–13:26:11.305Z) · boson 0 |
| 5 | Desk lane ≥ 15 % of landed hops (option a) | **PASS** | desk **19.9 %** of all 5,278 landed hops (21.3 % of desk + muon + boson) |
| 6 | mini, muon, boson: attempts every second + non-contention ≤ 1 % (shares reported only) | **PASS** | 1,800 s each; errors 0 / 0.07 % / 0. Shares: mini 6.8 · muon 15.4 · boson 58.0 % |
| 7 | Node RPC < 50 ms | **FAIL** | desk node-watch max **97 ms** (one sample, 13:25:44Z; p95 2 ms). Mini max 3 ms |
| 8 | Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch desk 359/360, mini 360/360, max gap 5.07 s; hop log full window |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | node-recovery: desk mempool 2 at 5 s after END, mini 3 at 0 s |
| 10 | 29 Oct items: handoff auto-copy, guard, post-end mempool + clock, all lanes together, after-END recount | **PASS** | handoff push 53 ms, sha256 match; guard refused without handoff (`GUARD_PRE exit=2`) and passed with it; post-end CSVs 240 rows each, 0 errors; **`RECOUNT_OK rows=4`** without a manual re-run |

**7 / 10.** This is a plain count of the 10 criteria above. It is higher than a4's 6/10, but a5 is **not** a better run: throughput fell from 4.09 to 2.93 hops/s, because three families stopped for good. The freeze is not a PLAN criterion of its own. It shows up through criterion 3, and it is the main thing to fix.

## Lanes (all attempts inside the window, submit logs → `score.mjs`, `SHARE_LANES=desk`)
| Lane | Attempts | Submit ok | Contention (already_spent + orphan) | Non-contention | Attempting seconds | Landed hops | Share of all landed | ok → landed |
|---|---|---|---|---|---|---|---|---|
| desk | 34,584 | 5,331 | 29,253 | 0 | **1,800 ✅** | 1,050 | **19.9 % ✅ (scored)** | 19.7 % |
| mini | 34,276 | 5,000 | 29,276 | 0 | **1,800 ✅** | 357 | 6.8 % (reported) | 7.1 % |
| muon | 33,960 | 5,017 | 28,919 | 24 (0.07 %) | **1,800 ✅** | 812 | 15.4 % (reported) | 16.2 % |
| boson | 34,128 | 4,762 | 29,366 | 0 | **1,800 ✅** | 3,059 | 58.0 % (reported) | 64.2 % |

All 5,278 hops in the hop log are attributed to a lane. Landed per lane and family (desk · mini · muon · boson): f1 383 · 123 · 278 · 1,150; f2 348 · 122 · 283 · 1,021; f3 48 · 24 · 44 · 166; f4 233 · 81 · 193 · 649. boson still wins most races in every family, but less than in a4 (58 % vs 69 % of all hops).

Funding pools (5 s log): 388–396 at START, never below 282 (end: desk 297, mini 310, muon 336, boson 320). No coin starvation ✅.

Sender-side submit rpc (submit logs, p50 / p95): desk 0 / 1 ms, mini (tunnel) 1–2 / 15–45 ms, boson 25 / 48–50 ms, muon 97 / 140–142 ms.

## Chain result
- **Hop log** (mini coordinator): **5,278 hops in 1,800 s = 2.93 hops/s.** Per family: 1,985 · 1,818 · **284** · **1,191**.
- **After-END recount** (`RECOUNT_OK`, 13:51:06–13:51:10Z, mini node, own builder): 1,986 · 1,817 · **283** · 1,195 = **5,281 hops ≈ 2.93 hops/s**. The two counts agree once the details are known. f1 +1 is a tail hop after 13:50:00. f4 −4 = the coordinator resync 335 → 340 (5 hops not logged one by one) minus the phantom hop 1,196. **f2, f3 and f4 are each one hop lower in the recount than in the coordinator's and senders' last state** (1,818 / 284 / 1,196), which is the evidence for the freeze below.
- By 5 minutes (hops/s): 4.13 · 3.26 · 3.25 · 2.97 · 2.21 · 1.78. Per family per 5 min: f1 319 · 333 · 333 · 328 · 335 · 337 (flat), f2 319 · 325 · 324 · 325 · 327 · 198 (stops 13:48:04), f3 284 · 0 · 0 · 0 · 0 · 0 (stops 13:24:30), f4 317 · 319 · 318 · 237 · 0 · 0 (stops 13:38:39). The total falls in steps as families die; **a running family does not fade**.
- Submit → accept-header latency of winning hops: p50 425–476 ms, p95 882–962 ms in every 5 min (a4: ~470 / 0.9–1.0 s). Landing speed was flat.
- Coordinator: `STALL` family 3 at 13:25:30Z, family 4 at 13:39:39Z, family 2 at 13:49:04Z, **no `STALL_END`**. One resync (family 4, 13:25:23Z, seq 335 → 340); the resyncs for the stalled families never succeeded and logged nothing.

## Timing logs (new in a5)
| Measure | 13:20 | 13:25 | 13:30 | 13:35 | 13:40 | 13:45 |
|---|---|---|---|---|---|---|
| desk `build_ms` p50 / p95 / max | 3 / 6 / 18 | 3 / 5 / 18 | 3 / 5 / 14 | 3 / 5 / 12 | 3 / 6 / 12 | 3 / 6 / 17 |
| family 1 `catchup_ms` p50 / p95 (all lanes) | 50 / 281 | 26 / 278 | 45 / 277 | 35 / 279 | 45 / 262 | 46 / 275 |
| `catchup_ms` p50, all families, desk lane | 3 | 3 | 2 | 6 | 2,001 | 2,001 |
| catch-up timeouts, all lanes (`catchup-*.jsonl`) | 72 | 592 | 598 | 732 | 1,155 | 1,365 |
| builder queue `bq` max (any lane) | 7 | 7 | 7 | 7 | 7 | 7 |
| in-flight `q` max: desk/mini/boson · muon | 4 · 8 | 4 · 8 | 4 · 7 | 4 · 8 | 4–8 · 8 | 4 · 8 |
| sender CPU % avg: desk · mini · muon · boson | 4.5 · 3.7 · 3.2 · 4.0 | 15.9 · 13.5 · 4.3 · 7.4 | 15.8 · 12.7 · 4.4 · 7.7 | 16.2 · 13.1 · 5.0 · 8.4 | 17.1 · 16.1 · 6.3 · 11.2 | 16.8 · 16.1 · 6.6 · 12.0 |
| sender RSS MB (all lanes) | 97–157 | 152–232 | 211–235 | 212–234 | 214–239 | 215–240 |
| 4 `kcc20` builders CPU s per 5 min | 7.0 · 20.0 · 25.4 · 19.6 | 31.2 · 83.8 · 220.9 · 175.6 | 31.9 · 85.9 · 220.9 · 177.0 | 37.1 · 95.4 · 225.5 · 190.9 | 58.3 · 139.7 · 246.7 · 237.3 | 68.1 · 154.5 · 244.8 · 237.1 |

What the timing logs show:
- **The builder does not slow down over time.** Build p95 stayed 5–6 ms for the whole run, with one builder per sender. a4's "builder gets slower" theory is ruled out for a5.
- **No pile-up.** Builder queue max 7 and in-flight max 4–8 per lane, flat for 30 min. The single-flight catch-up works.
- **Catch-ups for a live family stay cheap** (family 1 p50 26–50 ms, p95 ~280 ms, flat).
- **Every catch-up for a dead family hits the 2 s cap**: family 3 740 / 732 / 719 / 726 timeouts (desk / mini / muon / boson), family 4 334 / 329 / 321 / 336. That builder work (`nextspk` walks forward from a tip that will never move) is what drives builder CPU from ~20 s to ~240 s per 5 min. CPU is not a limit on the 24-thread desk, but it is wasted work.
- Per sender, the total catch-ups were desk 15,594, mini 13,799, muon 10,334 and boson 10,597, with 1,111–1,159 timeouts each.
- Sender RSS grew from ~97 to ~230 MB in the first 10 minutes, then stayed flat (≤ 240 MB). Watch it on longer runs.

## Nodes (node-watch every 5 s)
| Node | Rows in window | synced | peers min | rpc max / p95 | mempool max | kaspad CPU / RAM max | DAA/s |
|---|---|---|---|---|---|---|---|
| desk | 359/360 | 100 % | 7 | **97** / 2 ms | 59 | 3.1 % / 7.5 GB | 10.03 |
| mini | 360/360 | 100 % | 8 | 3 / 1 ms | 59 | 6.8 % / 4.8 GB | 10.02 |

No node-watch errors, max gap 5.07 s. Desk 97 ms is a single row (13:25:44Z, mempool 4). The next rows are back to 1–2 ms. It is 21 s after the family-4 resync and 26 s before muon's WebSocket drop; a cause is not measured. Peers dipped to 7 on the desk at 13:25:49–59, 13:39:00 and 13:46:46–56.
Recovery: post-END node-watch mempool desk 2 / mini 2 at the first row, max 53 / 56 over 20 min (TN10 background). Post-end mempool CSVs: 240 rows each, 0 errors, max 53 / 53, rpc max 26 / 36 ms ✅.
Clock (`clock-*.csv`, pool.ntp.org, 5 samples): desk −115.4 / −114.5 ms at 12:58Z, **−119.1 ms at launch 13:08:03Z**, **−132.9 ms after END 13:50:04Z**, so it drifts by about −0.33 ms/min. Mini +11.8 ms (12:58Z) / +13.4 ms (13:51Z).

## What worked (a5 fixes)
1. **One builder per sender** (no shared broker on the desk): build p95 ≤ 6 ms for 30 min, the builder never slowed.
2. **Single-flight catch-up with a 2 s cap**: no pile-up (bq ≤ 7, q ≤ 8), and no lane ever stopped attempting (1,800 / 1,800 s on all four), even with three dead families.
3. **No fade in a running family**: family 1 landed 1.06–1.12 hops/s in every 5 min. In a4 the rate fell from 5.3 to ~2.2 hops/s over all families after 15 min.
4. **Per-attempt timing, queue, CPU/RAM and catch-up logs** are complete for all four lanes (360 proc rows each), and they found the real failure.
5. **Recount with its own builder**: `RECOUNT_OK rows=4` at 13:51:10Z, unattended (a4 needed a manual re-run).
6. Preflight (4/4 lanes, 400 coins), handoff push 53 ms, guard refused without the handoff and passed with it, coordinator kept logging through three STALLs, timestamped stderr (all sender `.err`/`.out` files are empty).
7. The genesis-key funding abort at 12:54:55Z was caught before START by the guard. No sender ever started on an empty handoff.

## What didn't, and why
1. **Three families stopped for good: a "phantom tip" the code can't step back from.** Family 3 is the clearest case. Its last hop in the hop log is seq 284, seen at 13:24:30.546Z (accept header 13:24:30.328Z). The coordinator state (mini) and the shared sender state (desk) both hold **seq 284**. From 13:25 on, every attempt by every lane used `tip_seq` 284: about 5,700 attempts per 5 min, **0 ok**, and 5,568–5,719 `orphan` per 5 min (the input is in neither the UTXO set nor the mempool of any of the four nodes). The after-END recount on the mini node finds the **live minter at seq 283**. So hop 284 was briefly at its expected address in the mini node's UTXO index, and then it was gone, with hop 283's output live again. Families 4 (state 1,196, recount 1,195, last hop 13:38:39.251Z) and 2 (state 1,818, recount 1,817, last hop 13:48:04.161Z) show the same pattern: exactly one hop ahead. **Why the hop left the virtual UTXO set is not measured.** The most likely cause is a virtual-chain reorg that un-accepted it, because a DAG under four-way contention for the same outpoint produces these. But the coordinator ignores `removedChainBlockHashes`, so we have no record. **Why a5 never recovered is in our code**: `newest()` always prefers the higher seq, `markStale` on orphan only moves forward, and `catchUp` from seq N only looks at N and beyond (`step` → `liveAt` → `tipFind` forward), so it hits the 2 s cap every time. The coordinator's 30 s resync also walks only forward and swallows the error. No component ever checks seq N − 1. The a5 rule "never walk from an old state" turned a one-hop revert into a dead family.
2. **More orphans per family than a4.** In a running family (f1), the four lanes logged ~1,550 orphans per 5 min, against ~420–540 per family per 5 min in a4's first 15 minutes. a5 keeps submitting on the cached tip while a catch-up runs, so more attempts lose as orphans. The landing rate per running family was 1.06–1.12 hops/s, against ~1.33 in a4's first 15 min. That rate held, but it is lower.
3. **Desk clock −119.1 ms** at launch, −132.9 ms after END. It drifts about −0.33 ms/min, so a one-time `w32tm /resync` will not hold. The desk needs w32time set to sync with NTP regularly (admin).
4. **Desk node-watch RPC 97 ms** once (13:25:44Z). Everything else was ≤ 2 ms (p95). Node-side, not measured further. kaspad stays hands off.
5. **muon WebSocket drop** 13:26:10.231–13:26:11.305Z: 24 `rpc` rejects (0.07 %) and 23 `catchup_error`, then it reconnected by itself. Within the 1 % rule.
6. **Log name collision**: the desk sender (label `desk`) and `desk-a5.ps1` both write `logs/proc-desk.csv`. The file holds 360 sender rows (7 columns) and 5,325 process rows (5 columns, from 13:20:05Z) mixed together, without the process header. Both parse, but the names must differ.
7. **Mini builder broker crashed at END** (`write EPIPE`, unhandled `'error'` on its socket at 13:50:00Z, `broker.err`) when the coordinator stopped. It had no effect on the run or the recount (own builder), but it is an unhandled error.
8. **`score.mjs` with one share lane** reported the desk as 100 % (its share of itself). Fixed in this commit: with a single share lane the denominator is all landed hops.

## Root cause found for a4's fade after 11:45 and the 81 s family-3 freeze (written before a5)
From the a4 code (self-source senders):
1. **Every reject threw the sender's tip away** (`selfState.delete`), and ~78 % of attempts are rejects. The next attempt for that family then started a fresh `catchUp` from the *shared* state file, with **no single-flight**: at 5 attempts/s per family that is several overlapping walks per family per sender.
2. A walk on a tip that has moved fell into `tipFind`, which always computed **32 `nextspk` calls, then 32 more** to "confirm", i.e. ~64 builder commands for a 1-hop lag.
3. All four senders shared **one** `kcc20 storm` builder through the broker, behind one global gate. So builder work grew with the number of rejects, the queue grew, tips got staler, more attempts were orphans, and that made more walks: a feedback loop. That matches the a4 data (attempts flat, `orphan` up 10–20× on all lanes at once, nodes flat).
4. The family-3 freeze is the same loop hitting one family. Nothing bounded a walk, so all four senders sat in `current()` → `catchUp()` for family 3 for 81 s.
5. `writeState` busy-waits up to ~100 ms on a Windows rename conflict, and four processes were writing the same file on every catch-up.

## What changed for a5 (code in `tools/storm/`)
| Change | Where | Why |
|---|---|---|
| **One builder per sender** (`STORM_BUILDER_DIRECT=1`, `STORM_ROOT=roots\<lane>`, a copy of `contracts/` + `build/` per lane). No shared broker on the desk | `launch-desk.ps1 -BuilderRoots`, `covenant.mjs` (env root first) | Removes the shared global gate. Tested: 4 builders in parallel with separate roots all answer `ping`. With one shared root, the second process fails on `artifact.json` (it is rebuilt and opened exclusively) |
| **Single-flight catch-up per family, 2 s cap** (`catchup_ms` in config) | `sender.mjs` `refresh()`, `covenant.mjs` deadline | At most one walk per family per sender. Attempts keep using the cached tip meanwhile, so they never pile up behind a walk. A walk over 2 s is abandoned and logged |
| **Re-read the tip on an orphan** | `sender.mjs` `markStale()` | On `orphan`, take the shared state if it is newer, and start the next walk from the newest of cache and shared state, never from an old one |
| **Reject keeps the tip** (marked stale, not deleted) | `sender.mjs` | No walk from scratch after every lost race |
| **`tipFind` with growing batches** (4 → 8 → 16 → 32), then step forward one hop at a time | `covenant.mjs` | A 1–2 hop lag costs ~4–6 builder calls instead of ~64 |
| `writeState` only when the walk advanced the seq | `sender.mjs` | Less rename contention on the shared state file |
| **Per-attempt timing**: `build_ms`, `tip_seq`, `catchup_ms`, `q` (in-flight attempts), `bq` (builder queue depth) in every submit row | `sender.mjs` | a4 could not prove where the time went |
| **CPU/RAM every 5 s**: `logs/proc-<lane>.csv` (sender cpu %, rss, in-flight, builder queue, catch-ups, catch-up timeouts) and `logs/proc-desk.csv` (every node/kcc20 process: CPU s, RAM) | `sender.mjs`, `desk-a5.ps1` | Shows whether a sender or builder slows down over time |
| Catch-up timeouts/errors in `private/catchup-<lane>.jsonl` | `sender.mjs` | Kept out of the submit log, so they don't change attempt counts |
| **Timestamps on every stderr line** (sender, broker, builder) | `sender.mjs`, `builder-broker.mjs`, `covenant.mjs` | a4's `.err` lines could not be placed before or after END |
| **Recount with its own builder** (`STORM_BUILDER_DIRECT=1`), plus `RECOUNT_OK` or a loud `RECOUNT_FAIL` in phase.log if `recount.csv` is missing | `mini-a5.ps1` | a4's recount died with `ECONNREFUSED` because the broker had already exited |
| Share rule: desk ≥ 15 %; muon/boson scored on attempts + errors, shares reported (stp, option a) | `plan/PLAN.md` dated change | A public node's win share depends on its distance to the TN10 miners |

Unchanged from a4: lane preflight (DNS, wRPC, synced, coins ≥ 200), detached orchestrators on both machines, automatic handoff push and guard, coordinator that never stops on STALL plus a 30 s async resync, 5 s node-watch, post-end mempool and clock CSVs.


## Raw logs (not in git)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a5\{logs\phase.log, logs\proc-*.csv, logs\pool-*.csv, logs\node-watch-desk.csv, logs\clock-desk.csv, out\*, private\submit-*.jsonl, private\catchup-*.jsonl}`, kit `kit5\`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a5\{logs\phase.log, logs\recount.csv, logs\node-watch-mini.csv, out\*, private\hops.jsonl, private\resync.jsonl}`
- In git (counts only): [a5/score-a5.json](a5/score-a5.json) (`score.mjs` output, `SHARE_LANES=desk`), [a5/recount-a5.csv](a5/recount-a5.csv), [a5/per5min-a5.csv](a5/per5min-a5.csv).

Scored with `tools/storm/score.mjs` (submit logs → csv, joined with the mini's landed-hop log, window 13:20:00–13:50:00Z). Timing, proc, pool, node-watch and catch-up numbers come from the raw logs above, counted on the Grok Bot box, which was used for analysis only.

## Launch (UTC)
| Time | Event |
|---|---|
| 13:07:59 | fresh genesis on the mini, 4 families, handoff created and pushed |
| 13:08:02 | desk `HANDOFF seen_on_desk` → `PREFLIGHT exit=0` (all 4 lanes: DNS ok, synced, 400 coins; wRPC desk 21 ms, mini 9, muon 325, boson 107) → guard OK |
| 13:08:03 | `LAUNCH exit=0`: `broker none (one builder per sender)`, 4 senders, 4 `kcc20` builders |
| 13:20:00 | START (12 min after everything was ready) |

**Clock:** the desk clock was **−119.1 ms** at launch, outside the 100 ms pre-check limit (a4: −88 ms). It is logged, so per-second counts can be corrected, and it fails criterion 1 (see score). It also drifted to −132.9 ms by END.
