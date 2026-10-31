> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a9 · second 2-hour confirmation of the a7 setup · 4 families · rate 5 · 120 min · **SCORED 9/10**

Same as a8 (lanes desk, mini via tunnel, muon, boson; kit8 coordinator with hop-log back-fill + `RECOUNT_MATCH`). The box is not part of the run.
a8 scored 7/10: the boson lane pool ran dry at 01:40Z (criteria 2 and 6), and the mempool criterion 9 failed on a backlog that was there before START.

## Fixes vs a8
1. **Lane funding for the whole window.** a8 boson burned ≈ 55 tKAS/min (it lands ≈ 68 % of hops and pays those fees); its 400 coins lasted ≈ 95 min. Now desk 600, mini 600, muon 600, **boson 800** coins of 16 tKAS (Grok Bot TN10 wallet, 34 txs incl. 1 prep tx, fees ≈ 0.6 tKAS).
2. **Preflight checks usable value, not only count** (`preflight.mjs`, kit9): `usable_tkas` = Σ (coin − 3 tKAS) over pool coins, must be ≥ the lane's `usable_min_tkas` (desk 4000, mini 2000, muon 4000, boson 8600 ≈ 2 h burn × 1.3); `min_coins` 400. Read-only check at 03:07Z: desk 5,391 · mini 7,140 · muon 5,924 · boson 10,632 tKAS usable, all pass. (Before funding the same check failed all four lanes, e.g. desk 394 coins but only 110 tKAS above 15 tKAS coins.)
3. **Low-pool alert** (`sender.mjs`, kit9): `POOL_LOW sender=<lane> coins=<n>` in phase.log when a pool drops under `pool_low` (100), `POOL_OK` when it recovers (+20).
4. Funding script: the treasury holds ~1.47 M small mined coins, so a full UTXO query takes ~40 s and timed out on muon; it now prepares 29 coins of 700 tKAS once and uses one per 40-output batch (via boson).

## Mempool backlog (read-only census, 31 Oct 02:46Z, `mempool-ro.mjs`, two snapshots 60 s apart)
| Node | Entries | Ours | Others | Orphans | Still there after 60 s | Avg fee |
|---|---|---|---|---|---|---|
| desk | 52 | 0 | 52 | 0 | 52 / 52 | ≈ 0.094 tKAS |
| mini | 677 → 726 | 0 | all | 0 | 676 / 677 | ≈ 0.008 tKAS |

None of the entries pay to our lane or genesis keys: it is other TN10 traffic (1 input / ~2 outputs). The desk's 52 sat unchanged through all of a8 (stuck, not draining); the mini's set is mostly stuck as well, with new arrivals. It does not come from the storm and does not change during a run.
**Criterion 9 is scored strictly (mempool ≤ 5 within 10 min after END), as the rule stands.** An *unofficial* line is also reported: back to **pre-run baseline + 5** within 10 min. Changing the rule is stp's decision.

## Launch (UTC / CET)
| | UTC | CET |
|---|---|---|
| orchestrators started (desk pwsh 7 kit9, mini kit8) | 03:07 | 04:07 |
| genesis / handoff | 03:17 | 04:17 |
| **START** | **03:25** | **04:25** |
| **END** | **05:25** | **06:25** |
| recovery + recount done | ~05:45 | ~06:45 |

Mini `PREFLIGHT_GENESIS exit=0` (each genesis key down to 1 coin ≥ 15 tKAS: top up before a10).

## Result: **9 / 10** (2-hour confirmation **not** passed, by criterion 9 only)
Scored Sat 31 Oct 2026 ~07:10 CET on the Grok Bot box (analysis only) with `tools/storm/score.mjs` (kit8/9, `SHARE_LANES` empty = plan 2b) and [`tools/storm/analyze-a9.cjs`](../../../tools/storm/analyze-a9.cjs). Both orchestrators had finished on their own (desk `RECOVERY_DONE` 05:45:10Z, mini `RECOVERY_DONE` 05:45:14Z). The run dirs were zipped read-only on the desk and the mini and copied to the box. No process was started or stopped, and kaspad was not touched.

**37,487 hops by recount = 5.21 hops/s over 7,200 s** (a8 5.06). Per family f1 9,401 · f2 9,361 · f3 9,404 · f4 9,321 = 1.306 · 1.300 · 1.306 · 1.295 hops/s. Hop log: 37,506 lines, 37,483 unique family+seq (37,103 coordinator + 60 resync + 343 back-fill), 0 revert lines. **`RECOUNT_OK rows=4` and `RECOUNT_MATCH hoplog=37483 recount=37487 diff_pct=0.011 tol_pct=0.5`** (05:26:47Z / phase 05:45:14Z, unattended).

**The a8 funding fix worked:** no `POOL_LOW` line on any lane (0 in phase.log), lowest pools desk 435 · mini 464 · **muon 297** · boson 682; at END desk 537 · mini 554 · muon 353 · boson 733 usable coins (preflight: 600/600/600/800). Throughput per 10 min stayed flat: 5.14 · 5.10 · 5.22 · 5.02 · 5.00 · 5.21 · 5.13 · 5.15 · 5.24 · 5.26 · 5.21 · 5.25 hops/s (landed, non-back-fill; a8 fell to 4.4).

No family froze: 0 `STALL`, 0 `PROC_EXIT`, 0 `SENDER_OFF`/`NODE_SKIP`/`NODE_DROP`, all four sender `.err` files empty, `SENDERS_EXITED left=0`. 129 sender `TIP_BACK` (all `why=timeouts`, recovered at once), 20 coordinator `TIP_BACK`, 3,890 `UNACCEPT`, 60 resyncs (all back-filled). Longest gap between any landed hops 1.83 s (04:01:33Z). Longest per family 5.94 · 6.56 · 7.07 · 6.59 s (a8 f1 15.8 s).

| # | Criterion | Result | Key number |
|---|---|---|---|
| 1 | Pre-checks: synced, peers ≥ 8, clock within 100 ms, disk ≥ 100 GB | **PASS** | desk clock **+3.9 ms** (03:07Z), **+1.8 ms** (preflight gate row 03:17Z, `offset_ms=2.0 pass=1`), **+6.3 ms** after END; mini **+18.9 ms** (03:07Z), **+20.8 ms** after END. Both synced every node-watch row; peers 8 at start and **never below 8** in the window (a8 dipped to 7). Free disk desk 428 GB, mini 310 GB (read 07:08 CET). One bogus desk row (03:08:04Z, n=1, −4.0e12 ms) is a zero-timestamp NTP reply, not a clock step; fixed in `clock-offset.mjs` (RUNBOOK 10) |
| 2 | Every lane ≥ 1 attempt in each of 7,200 s | **PASS** | desk 7,200 · mini 7,200 · muon 7,200 · boson 7,200 |
| 3 | Hops land in ≥ 99 % of seconds | **PASS** | **99.32 %** (7,151 / 7,200). Missed per 10 min: 2 · 6 · 0 · 10 · 10 · 3 · 4 · 4 · 2 · 1 · 2 · 5 |
| 4 | Every reject is contention; non-contention ≤ 1 % per lane | **PASS** | desk/mini/muon 0; **boson 32 (0.02 %)**: `rejected rpc` "WebSocket disconnected" 05:08:14.98–05:08:16.57Z (public node), boson landed again within the same 2 s, no `SENDER_OFF`. 545,780 attempts in total |
| 5 | Desk lane: attempts every second + non-contention ≤ 1 % (share reported) | **PASS** | 7,200 s, 0 errors. Share **12.54 %** (4,660 / 37,163) |
| 6 | mini, muon, boson: attempts every second + non-contention ≤ 1 % (shares reported) | **PASS** | all 7,200 s; errors 0 · 0 · 0.02 %. Shares mini 4.57 · muon 17.29 · boson 65.60 % |
| 7 | Node RPC p95 < 50 ms and max < 250 ms per node | **PASS** | desk p95 **5**, max **16** ms; mini p95 **2**, max **25** ms |
| 8 | Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch 1,438 / 1,437 rows in the window, max gap 5.02 / 5.05 s, first row 4.3 / 4.1 s after START, last 0.2 / 4.3 s before END; post-end 240 rows each |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **FAIL (strict, official)** | desk post-END **55–114** (55 at 0 s), mini **676–726** (679 at 0 s); never ≤ 5. Same foreign backlog as before START |
| 10 | 29 Oct items: handoff, guard, post-end, all lanes together, after-END recount | **PASS** | handoff sha256 ok 03:16:59Z (52 ms), seen on desk 03:17:02Z; guard refused before the handoff (`GUARD_PRE exit=2 refused=1`, 03:08:04Z), `guard exit=0` 03:17:03Z; all lanes from 03:25:00Z; post-end ran on both; `RECOUNT_OK rows=4` + `RECOUNT_MATCH` 0.011 % |

### Criterion 9, unofficial line (pre-run baseline + 5, not the rule)
Measured pre-run baseline (node-watch 03:07–03:25Z, before START): **desk min/median 52** (206 rows, max 105), **mini min/median 676** (207 rows, max 731). Limits: desk ≤ 57, mini ≤ 681.
- Reached within 10 min: **yes on both, at 0 s after END** (desk 55, mini 679) → **unofficial PASS**.
- Held for the whole 10 min: no. Desk 112 / 120 rows ≤ 57 (short spikes, e.g. 62 at 361 s, 114 max); mini 109 / 120 rows ≤ 681 (726 at 596 s). The same kind of spikes were in the pre-run rows (desk to 105, mini to 731) while no sender of ours was running, i.e. other TN10 traffic arriving.

### Lanes (window 03:25:00–05:25:00Z)
| Lane | Attempts | ok | contention | non-cont. | Landed | Share | sender rpc_ms p95 / max | tip age p50 | pool start → min → END |
|---|---|---|---|---|---|---|---|---|---|
| desk | 137,985 | 38,678 | 99,307 | 0 | 4,660 | 12.54 % | 1 / 30 | 224 ms | 600 → 435 → 537 |
| mini | 137,716 | 38,559 | 99,157 | 0 | 1,699 | 4.57 % | 44 / 322 | 245 ms | 600 → 464 → 554 |
| muon | 132,011 | 34,450 | 97,561 | 0 | 6,427 | 17.29 % | 127 / 611 | 305 ms | 600 → 297 → 353 |
| boson | 138,068 | 38,147 | 99,889 | 32 | 24,377 | 65.60 % | 33 / 540 | 288 ms | 800 → 682 → 733 |

Data: [score-a9.json](data/score-a9.json), [recount-a9.csv](data/recount-a9.csv), [recount-check-a9.txt](data/recount-check-a9.txt), `data/pool-<lane>-a9.csv`, `data/post-end-mempool-<node>-a9.csv`. Raw submit logs and the hop log stay off git (txids).

### What worked
- Funding sized to the window + usable-value preflight: no lane came near `POOL_LOW` (100); boson never below 682. Criteria 2 and 6 now pass for 2 hours.
- Stable 5.0–5.26 hops/s all 2 hours, 0 freezes, RECOUNT_MATCH 0.011 %, clocks within ±21 ms, node RPC far under limits.

### What didn't, and why
1. **Criterion 9 (strict)**: the nodes' mempools hold other people's TN10 transactions (census: 0 of ours) that sit there before, during and after the run; the ≤ 5 rule cannot be met while that backlog exists. The run itself left nothing behind (back at baseline at 0 s).
2. Flaws (no criterion): one boson WebSocket drop (1.6 s, 32 rejects); one bogus clock row from a zero-timestamp NTP reply; genesis keys are down to 1 coin ≥ 15 tKAS each; muon pool lowest at 297 (fine at rate 5, would not last at 3×).

### Fixes for a10
1. **Criterion 9**: stp's decision. Either (a) a dated rule change to "mempool ≤ pre-run baseline + 5 within 10 min after END, foreign entries excluded by census" (a9 passes that), or (b) score only *our* mempool entries (`mempool-ro.mjs` census at END+10 min must show 0 of ours) — the cleanest rule, since it measures what the run leaves behind. Without a change, a10 can only pass 9 if the TN10 background clears on its own (wait and launch when both nodes read ≤ 5).
2. Top up the 4 mini genesis keys (≥ 3 coins ≥ 15 tKAS each) and the lanes back to 600/600/600/800 before a10.
3. Deploy the fixed `clock-offset.mjs` to the desk and mini kits.
4. a10 = the same 2-hour setup again once the criterion-9 rule is settled; scaling stays blocked until a 2-hour 10/10.

## Re-score, 31 Oct 2026 (criterion 9 changed by stp, 07:36 CET)
New criterion 9: 0 own transactions in the desk and mini mempools at END + 10 min. a9 logged only mempool **size** after END (`post-end-mempool-*.csv`), no own-tx counts, so **criterion 9 is unconfirmed** and the score stays **9/10 (unconfirmed for 9)**. Evidence against: a census at END + 73–76 min found 3 own tx (desk) and 6 (mini), persistent, mass ≈ 200 k, not orphans, see RUNBOOK 11. a10 is therefore the same 2-hour setup, not 3x.
