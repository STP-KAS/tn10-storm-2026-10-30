> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a4 · 4 families · rate 5/family · 11:30:00–12:00:00 UTC

**a4 ended cleanly but FAILS (6/10).** Fresh genesis, all four lanes attempting from the first second to the last, no lane errors and healthy nodes. Two criteria fail: hops landed in only **94.3 %** of seconds, and the **muon** lane got **9.0 %** of the landed hops (rule is ≥ 15 %). Throughput was **5.3 hops/s for the first 15 minutes, then fell to ~2.2 hops/s** after 11:45. The coin pools stayed full this time, so the a3 explanation (funding-coin starvation) does not cover this drop.

Desk: `START` 11:30:00Z, `END reason=window` 12:00:00Z, `SENDERS_EXITED left=0` 12:00:04Z, `RECOVERY_DONE` 12:20:11Z. Mini: coordinator `STOP reason=END` 12:00:00Z, `END` 12:00:04Z, `RECOVERY_DONE` 12:20:11Z. No a4 processes were left on either machine.

## Timeline (UTC)
| Time | Event |
|---|---|
| 11:07:17 | desk orchestrator up (node-watch, receiver, post-end). `GUARD_PRE exit=2` = guard refused because no handoff existed yet ✅ (as designed) |
| 11:07:57 | mini orchestrator up (node-watch, broker, coordinator-a4, post-end) |
| 11:09:49 | preflight dry run: 4/4 lanes pass |
| 11:14:56–59 | **fresh genesis**, families 1–4 included (seq 0) |
| 11:14:59.989 | mini handoff push ok, sha256 match, 53 ms ✅ |
| 11:15:02–03 | desk `HANDOFF seen_on_desk` → `PREFLIGHT exit=0` (DNS ok, synced, 320 coins per lane; wRPC desk 20 ms, mini 5, muon 208, boson 102) → guard OK |
| 11:15:06 | `LAUNCH exit=0` (broker + 4 senders) |
| 11:30:00 | START: desk, mini, muon, boson all attempting from second 0 ✅ |
| 11:40:00 | the run's only pre-submit error (desk lane, family 3: `script ran, but verification failed`), logged as `result=error` |
| ~11:45 | rate starts to fall and orphan rejects rise on **all four lanes at the same time** |
| 11:48:24–11:49:45 | **family 3 has no hop for 81 s** (chain-side, see anomaly 2). Coordinator logs `STALL family=3` at 11:49:24 and `STALL_END` at 11:49:45 and **keeps running** (a4 fix works) |
| 12:00:00 | END; senders exited by 12:00:04 |
| 12:01:04 | after-END recount **failed**: `ECONNREFUSED 127.0.0.1:17310` (see "What didn't", 4) |
| 12:20:11 | 20 min recovery logging done on both machines |
| 12:30:14–23 | recount re-run during scoring with its own broker: success (`RECOUNT_RERUN` in the mini phase.log) |

## Lanes (all attempts inside the window, from the submit logs → `score.mjs`)
| Lane | Attempts | Submit ok | Contention (already_spent + orphan) | Non-contention | Attempting seconds (need 1,800) | Landed hops | Share (scored lanes) | ok → landed |
|---|---|---|---|---|---|---|---|---|
| desk | 34,539 | 7,505 | 27,033 | 1 (0.003 %) | **1,800 ✅** | 1,039 | **15.5 % ✅** | 13.8 % |
| mini | 34,454 | 7,300 | 27,154 | 0 | **1,800 ✅** | 657 | 8.9 % of all (reported only) | 9.0 % |
| muon | 34,394 | 5,283 | 29,111 | 0 | **1,800 ✅** | 601 | **9.0 % ❌** | 11.4 % |
| boson | 34,548 | 6,762 | 27,786 | 0 | **1,800 ✅** | 5,059 | 75.5 % ✅ | 74.8 % |

All 7,356 hops in the hop log are attributed to a lane (the winning txid matched a lane's submit-ok row). "Share (scored lanes)" = share of the 6,699 hops landed by desk + muon + boson (dated change, 30 Oct). Of all 7,356 hops: desk 14.1 · mini 8.9 · muon 8.2 · boson 68.8 %.

Per lane and family, boson won 1,188–1,350 hops in every family and the other three lanes won 146–290 each. The share is lopsided in every family, not just one.

Funding pools (5 s log per lane): 320 at preflight, 255–261 at START, never below 210 (end: desk 317, mini 210, muon 224, boson 212). **No coin starvation** ✅ (a3 fix works).

Sender-side submit rpc (from the submit logs): desk p50 0 / p95 1 ms, mini (via tunnel) 2 / ~45 ms, max 156; boson 17 / ≤ 47; muon 90 / ≤ 135, max 410.

## Chain result
- **Hop log** (mini coordinator, independent, ran the full window this time): **7,356 hops in 1,800 s = 4.09 hops/s.** Hops landed in **1,698 / 1,800 s = 94.33 %**. Per family: 1,882 · 1,849 · 1,795 · 1,830.
- **After-END recount** (walk from each genesis to the tip, mini node): 1,884 · 1,875 · 1,806 · 1,844 = **7,409 hops ≈ 4.12 hops/s** (it includes the last hops that landed just after 12:00:00). The difference from the hop log (+53) matches the 6 coordinator resyncs that skipped 35 seqs without logging each hop (family 2: +23, family 4: +12, family 3: +8) plus a few tail hops. The desk senders' final state (1,883 · 1,874 · 1,805 · 1,843) agrees within 1 hop per family. **The two counts agree.**
- By 5 minutes (hops/s): 5.31 · 5.27 · 5.35 · **4.23 · 2.26 · 2.10**. Missed landing seconds per 5 min: 2 · 1 · 2 · 19 · 35 · 43, so 97 of the 102 misses come after 11:45. The 102 missed seconds are 100 single seconds plus one 2 s gap, with nothing longer (the family-3 freeze did not empty any second, because the other families kept landing).
- Submit → accept-header latency of winning hops: p50 ~470 ms, p95 ~0.9–1.0 s, flat over the whole window, so landing speed itself did not degrade.
- a2 4.29 · a3 ~2.37 · **a4 4.09 hops/s** (first 15 min 5.3 = best so far).

## Nodes (node-watch every 5 s)
| Node | Rows in window | synced | peers min | rpc max / p95 | mempool max | kaspad CPU / RAM max | DAA/s |
|---|---|---|---|---|---|---|---|
| desk | 359/360 | 100 % | 7 | 17 / 1 ms | 59 | 3.3 % / 8.1 GB | 9.8–10.2 |
| mini | 359/360 | 100 % | 8 | 2 / 2 ms | 66 | 7.5 % / 5.8 GB | 9.8–10.2 |

No node-watch errors and no gaps > 5.1 s. Both nodes were flat through 11:45–12:00: same DAA rate, same CPU, and mempool no higher than before. The fade is **not** node-side.
Recovery: first post-END row mempool desk 2 / mini 3; `node-recovery` rows at 0 s after END (mempool 5, pass=1) on both ✅. Post-end mempool CSVs: 240 rows each over 20 min, 0 errors, max 59 / 55 (TN10 background), rpc max 24 / 37 ms ✅.
Clock: desk −88.1 ms at launch, −87.1 ms after END (inside 100 ms, still marginal); mini +38.8 / +52.3 ms.

## What worked (a4 fixes)
1. **Lane preflight**: DNS + wRPC + synced + coins ≥ 200 on all 4 lanes, twice, and START was gated on it. Boson ran on the right host from second 0.
2. **Funding**: 320 coins per lane; pools never went below 210. The a3 desk/boson fade from coin starvation is gone.
3. **Coordinator never stops on STALL**: it logged STALL/STALL_END for family 3 and kept the hop log for the full 30 min (a3 lost 23 min).
4. **Async 30 s resync**: 6 resyncs (+5 to +9 seq), none failed.
5. **pwsh 7 date fix**: no void END line; START/END on time on both machines.
6. **Pre-submit errors counted**: 1 builder error is in the submit log with a timestamp.
7. **muon**: no `node_dead` this time, and 1,800/1,800 attempting seconds.

## What didn't, and why
1. **Throughput fade after ~11:45 (all lanes at once).** From 11:45, submit-ok fell from ~1,600 to ~600 per 5 min per lane, while `orphan` rejects went up 10–20× (desk 118 → 2,366, boson 348 → 2,852, muon 1,099 → 4,151 per 5 min). The number of attempts stayed flat (~5,800 per 5 min per lane). Nodes, coin pools and landing latency were all flat. On TN10 an `orphan` reject means an input is in neither the UTXO set nor the mempool, which happens when a sender builds on a covenant tip that is already spent in a block. So the senders' view of each family's tip got **staler over time**. a3 faded at a similar point (7–15 min in), which suggests a sender/builder-side slowdown that grows with runtime: the shared builder broker (one process for 4 senders), the `catchUp` tip-walk, or both. This is not proven yet, because per-attempt `catchUp`/build times are not logged.
2. **Family 3 frozen 81 s (11:48:24–11:49:45).** In that 90 s window each lane logged only 41–49 family-3 rows instead of ~450. No lane submitted anything for family 3 between 11:48:24 and 11:49:44, and then all four resumed within 5 s. So every sender was stuck in `current()` → `catchUp()` for family 3 at the same time (the attempt waits there before it is logged). The other three families kept going, so every second still had attempts and hops. Same root as 1: `catchUp` has no time limit and no single-flight per family.
3. **muon share 9.0 % (rule ≥ 15 %), boson 75.5 %.** Every lane gets a similar number of submits into its own node's mempool (5.3k–7.5k ok), but **75 % of boson's ok submits land, against 9–14 % for desk, mini and muon**. Lane attempts and errors are the same, so the difference is in which conflicting tx the TN10 miners see first. boson appears to be closer, in propagation terms, to the miners producing TN10 blocks. That is an inference from these counts, not measured. Our side cannot make this fair without changing fees or topology, so the ≥ 15 % rule for public lanes measures the public network more than our setup.
4. **After-END recount failed at 12:01:04.** `mini-a4.ps1` starts `recount.mjs` 60 s after END, but the mini builder broker had already exited at 12:00:00 together with the coordinator (`builder exit 0`), so the recount could not reach port 17310. Re-run at 12:30 UTC with its own broker: OK (numbers above).
5. **stderr without timestamps.** The sender `.err` files hold `broker closed` and `ECONNREFUSED 127.0.0.1:17320` lines (muon: 1 broker closed + 38 refused + 1 `WebSocket disconnected`; mini: 1 + 2; boson: 1 + 1). The files were last written at 12:00:03, the submit logs have no `error` rows for them, and the desk broker exited at END, so they come from in-flight attempts after END. Still unproven without timestamps.

## Raw logs (not in git)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a4\{logs,out,state,private\submit-*.jsonl}`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a4\{logs,out,state,private\hops.jsonl}`
- In git (counts only): [a4/score-a4.json](a4/score-a4.json) (`score.mjs` output), [a4/recount-a4.csv](a4/recount-a4.csv), [a4/per5min-a4.csv](a4/per5min-a4.csv).

Scored with `tools/storm/score.mjs` (submit logs → csv, joined with the mini's landed-hop log, window 11:30:00–12:00:00Z, share lanes desk,muon,boson).
