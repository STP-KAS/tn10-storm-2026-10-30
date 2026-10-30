> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base · review (attempts a1–a5)

| Attempt | Result |
|---|---|
| a1 | aborted before launch, `no_handoff` (the guard worked) |
| a2 | full window, 4.29 hops/s, FAIL (re-scored on 30 Oct criteria). [ATTEMPT-a2](ATTEMPT-a2.md) |
| a3 | full window, clean END, ~2.37 hops/s, **FAIL** (4/10). [ATTEMPT-a3](ATTEMPT-a3.md) |
| a4 | full window, clean END, fresh genesis, **4.09 hops/s** (recount 4.12), **FAIL (6/10)**. [ATTEMPT-a4](ATTEMPT-a4.md) |
| a5 | full window, clean END, fresh genesis, **2.93 hops/s** (recount 2.93), three families frozen for good, **FAIL (7/10 criteria)**. [ATTEMPT-a5](ATTEMPT-a5.md) |

## a3 against the PLAN criteria
| Criterion | Result | Detail |
|---|---|---|
| Every lane ≥ 1 attempt in each of 1,800 s | **FAIL** | mini 1,800 ✅ · muon 1,790 · desk 1,663 · boson 1,397 |
| Hops land in ≥ 99 % of seconds | **FAIL** | 98.6 % over the 356 s that were measured; the hop log stopped at 10:11:57 (coordinator STALL), so the rest of the window is unmeasured |
| Non-contention rejects ≤ 1 % per lane | **PASS** | 0 % on all lanes (submit-level; pre-submit errors not logged) |
| Each lane ≥ 15 % of landed hops | **FAIL** | desk 40.1 · boson 40.3 · muon 15.2 · **mini 4.4** (first 356 s only) |
| Node RPC < 50 ms | **PASS** | desk max 38 ms, mini max 19 ms |
| Logs 1 row / 5 s, full window, desk + mini | **PASS (node-watch)** / FAIL (hop log) | node-watch 359/360 rows each; landed-hop log covers only 10:05–10:11 |
| Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | desk 2 / mini 0 at the first post-END row |
| 29 Oct missing items | mostly PASS | handoff auto-copy ✅ · guard ✅ · post-end mempool + clock on both ✅ · node-watch ✅ · **all four lanes on together ❌** (boson missing 10:05:00–10:07:52) |

## Score: 4 / 10
- **For:** clean, unattended detached run that survived two orchestrator restarts; clean END and recovery; both nodes healthy throughout (rpc ≤ 38 ms, synced, 8 peers); zero non-contention rejects; the new post-end mempool files exist; first 6 minutes ran at 4.43 hops/s, the best rate so far.
- **Against:** a known-wrong boson host was committed and reused, so boson missed 172 s. The independent hop counter stopped itself after 7 minutes, so most of the window has no independent landing evidence. Throughput fell to ~1.9 hops/s for the last 23 minutes (≈ 2.37 average, below a2's 4.29), most likely because the desk and boson lanes ran out of funding coins. Mini's share was 4.4 %.

## Fixes per failure (all for a4)
| Failure | Fix |
|---|---|
| Lanes not attempting every second (boson start) | Lane endpoints in config, not in the script: boson = `boson-10.kaspa.red`. **Preflight before START**: DNS + wRPC connect + `getServerInfo` for every lane; launch aborts if any lane fails. Sender logs DNS errors as `dns`, not `connect timeout` |
| Lanes not attempting every second (desk/boson fade) | **Fund each lane key with ≥ 300 funding coins** before the run (TN10 tKAS split from the bot wallet or desk wallet, no mining). Preflight refuses to start a lane with < 200 coins. Log the pool size every 5 s per lane |
| Lanes not attempting every second (muon) | Health probe: reconnect at once and keep submitting on a second connection; mark `node_dead` only after 3 failed probes in a row |
| Hops in ≥ 99 % of seconds unmeasured | Coordinator must **never** write STOP or exit on STALL during a self-test: log `STALL`/`GAP` and keep going. Resync timeout 5 s → 30 s, with the hop-walk batched from the last *seen* tip. Plus an after-END chain recount (walk each family from its start outpoint) as a second, independent count |
| Mini share 4.4 % | Structural: the mini lane goes desk → tunnel → mini and loses the race. Either run the mini lane's sender on the mini itself (local rpc ~2 ms), or for the share criterion count the mini lane against its own node only. **This is a decision for stp**, since the plan says all senders go on the desk |
| Void END line | `desk-a3.ps1`: read dates with `ConvertFrom-Json -DateKind String`; fail hard on an empty `$END`/`$T0` instead of falling through |
| Pre-submit errors not counted | Log builder/connect errors into the submit log as `result=error` with a timestamp, so they count toward the ≤ 1 % rule |
| Desk clock −88 ms | Still needs a one-time admin `w32tm /resync` (or set up the NTP service) on the desk |

## Recommendation for a4 (run at 11:30 UTC, see below)
Same base (4 families, rate 5, 30 min). Before starting: (1) the endpoint fix + lane preflight, (2) top up all four lane keys to ≥ 300 coins and check counts read-only, (3) coordinator no-stop-on-stall + 30 s resync + after-END recount, (4) pre-submit errors in the submit log, (5) the pwsh 7 date fix, (6) stp's decision on where the mini lane sender runs. **Fresh genesis** instead of reusing a2's families, so seq deltas and the recount start from zero.

## a4 against the PLAN criteria (incl. dated change 30 Oct: share rule desk/muon/boson, mini scored on attempts + errors)
| Criterion | Result | Detail |
|---|---|---|
| Every lane ≥ 1 attempt in each of 1,800 s | **PASS** | desk, mini, muon, boson: 1,800 / 1,800 each |
| Hops land in ≥ 99 % of seconds | **FAIL** | **94.33 %** (1,698 / 1,800). Misses per 5 min: 2 · 1 · 2 · 19 · 35 · 43 (97 of the 102 after 11:45) |
| Non-contention rejects ≤ 1 % per lane (pre-submit errors included) | **PASS** | desk 1 / 34,539 (0.003 %), mini 0, muon 0, boson 0 |
| desk / muon / boson each ≥ 15 % of their landed hops | **FAIL** | desk 15.5 ✅ · **muon 9.0 ❌** · boson 75.5 ✅ |
| Mini lane: attempts every second + errors ≤ 1 % | **PASS** | 1,800 s, 0 errors (share 8.9 %, reported only) |
| Node RPC < 50 ms | **PASS** | node-watch max desk 17 ms, mini 2 ms |
| Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch 359/360 each, no gap > 5.1 s; hop log full window (STALL logged, no stop) |
| Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | at 0 s after END on both (desk 2 / mini 3 first node-watch row) |
| 29 Oct missing items | **PASS** | handoff auto-copy ✅ · guard ✅ (refused without handoff, OK with it) · post-end mempool + clock both ✅ · all four lanes on together from 11:30:00 ✅. After-END recount ran late (manual re-run) |

## Score: 6 / 10
- **For:** every a4 fix held: preflight, 320-coin pools (never < 210), a coordinator that survives STALL, the pwsh 7 date fix and pre-submit error logging. All four lanes attempted every one of the 1,800 s with zero non-contention rejects. Nodes were flat and healthy. The hop log and the after-END recount agree (7,356 vs 7,409). 5.3 hops/s for 15 min is the best rate so far.
- **Against:** hops landed in only 94.3 % of seconds, and the rate fell to ~2.2 hops/s after 11:45 (orphans up 10–20× on every lane). One family froze for 81 s on all lanes at once. muon got 9 % of the landed hops because boson wins 75 % of the races. The after-END recount needed a manual re-run.

## Fixes for a5
| Failure | Fix |
|---|---|
| Fade after ~15 min + family-3 freeze (stale tips → orphans) | **Measure first**: log per attempt `catchup_ms`, `build_ms`, the tip seq used, and the broker queue depth, plus the CPU/RAM of senders and broker every 5 s. **Then bound it**: `catchUp` gets a 2 s limit and is **single-flight per family** (one walk per family per sender; other attempts wait for it or skip that tick, never pile up). On a timeout or `orphan`, re-read the tip from the coordinator's shared state (or a `getUtxosByAddresses` read on the covenant address) instead of walking again. **One builder per sender** instead of one shared broker (or restart the broker every 10 min), to test whether the builder slows down over time |
| Hops in ≥ 99 % of seconds | Follows from the fix above. 97 of the 102 missed seconds came after the fade started |
| muon share 9 % (boson 75 %) | Lane conversion (ok → landed) is set by TN10 propagation to miners, not by us. **Decision for stp:** (a) score public lanes on attempts + errors only, like mini, and keep the share rule for desk-vs-public as reported; or (b) keep the rule and try equalising: each sender also relays its winning tx to a second node (desk + boson) so the conflicting tx reaches the miners at the same time; or (c) drop the share rule for this step. Without a decision, a5 will most likely fail this criterion again for reasons outside our setup |
| After-END recount failed (broker gone) | `mini-*.ps1`: run `recount.mjs` with its own broker (or `STORM_BUILDER_DIRECT=1`) and do not let the coordinator's STOP take down the broker the recount needs. Fail loudly in phase.log if `recount.csv` is missing at RECOVERY_DONE |
| stderr lines without time | Prefix every sender/broker stderr line with an ISO timestamp, and keep writing `result=error` rows until the log closes, so post-END lines are visibly after END |
| Desk clock −88 ms | Still the one-time admin `w32tm /resync` (or NTP service) on the desk |

## Recommendation for a5 (not run)
Same base (4 families, rate 5, 30 min, fresh genesis, 320 coins per lane). Before starting: (1) per-attempt timing logs + single-flight `catchUp` with a 2 s limit + per-sender builder, (2) the recount broker fix, (3) timestamped stderr, (4) **stp's decision on the public-lane share rule**. a5 must reach 99 % landing seconds before the ladder moves on to the 3× rate run.

## a5 against the PLAN criteria (incl. dated change 30 Oct after a4: share rule desk only, option a)
| # | Criterion | Result | Detail |
|---|---|---|---|
| 1 | Step 1 pre-checks (synced, peers ≥ 8, clock ≤ 100 ms, disk ≥ 100 GB) | **FAIL** | **desk clock −119.1 ms** at launch, −132.9 ms after END (mini +11.8 / +13.4). Synced and 8 peers on both at START; disk 436 / 313 GB free (measured after the run) |
| 2 | Every lane ≥ 1 attempt in each of 1,800 s | **PASS** | desk, mini, muon, boson: 1,800 / 1,800 each |
| 3 | Hops land in ≥ 99 % of seconds | **FAIL** | **96.61 %** (1,739 / 1,800). Misses per 5 min: 3 · 3 · 5 · 7 · 20 · 23, all single seconds |
| 4 | Non-contention rejects ≤ 1 % per lane | **PASS** | desk 0 · mini 0 · muon 24 / 33,960 (0.07 %, 1.1 s WebSocket drop) · boson 0 |
| 5 | Desk ≥ 15 % of landed hops (option a) | **PASS** | **19.9 %** of all 5,278 (21.3 % of desk + muon + boson) |
| 6 | mini / muon / boson: attempts every second + errors ≤ 1 % (shares reported) | **PASS** | 1,800 s each; shares mini 6.8 · muon 15.4 · boson 58.0 % |
| 7 | Node RPC < 50 ms | **FAIL** | desk node-watch max **97 ms** (one row, 13:25:44Z; p95 2 ms); mini max 3 ms |
| 8 | Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch 359 / 360 desk, 360 / 360 mini, max gap 5.07 s; hop log full window |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | desk 2 at 5 s, mini 3 at 0 s after END |
| 10 | 29 Oct items + after-END recount | **PASS** | handoff push 53 ms ✅ · guard ✅ · post-end CSVs ✅ · all lanes from 13:20:00 ✅ · **`RECOUNT_OK rows=4`** unattended ✅ |

## Score: 7 / 10 (count of the 10 criteria)
- **For:** the a4 fade is gone for any family that keeps running (family 1: 1.06–1.12 hops/s in every 5 min for 30 min). The builder never slowed (build p95 ≤ 6 ms). There was no queue pile-up (bq ≤ 7). All four lanes attempted every second with three dead families. The recount ran unattended and agrees with the hop log (5,281 vs 5,278). The new timing logs found the real failure within one run.
- **Against:** **three of four families froze for good** (f3 13:24:30, f4 13:38:39, f2 13:48:04), so throughput fell to 2.93 hops/s (a4 4.09) and landing seconds to 96.6 %. The desk clock is outside 100 ms and drifting. One 97 ms RPC sample. The count is higher than a4's 6/10, but a5 is not a better run.

## a4 vs a5
| | a4 | a5 |
|---|---|---|
| hops/s total (hop log) | 4.09 | 2.93 |
| hops/s by 5 min | 5.31 · 5.27 · 5.35 · 4.23 · 2.26 · 2.10 | 4.13 · 3.26 · 3.25 · 2.97 · 2.21 · 1.78 |
| hops/s per **running** family | ~1.33 for 15 min, then ~0.53 (fade on all families) | 1.06–1.12 for 30 min (no fade), but families die one by one |
| landing seconds | 94.33 % (102 missed) | 96.61 % (61 missed) |
| orphans per family per 5 min (all lanes) | ~420–540 at the start, ×10–20 after 11:45 | ~1,550 in a running family, flat; ~5,700 in a dead family |
| freeze | f3 81 s, recovered | f3, f4, f2 frozen to END, **never recovered** |
| build time | not logged | p50 3 / p95 ≤ 6 ms, flat |
| catch-up time (running family) | not logged | p50 26–50 / p95 ~280 ms, flat; dead families: every catch-up hits the 2 s cap |
| builder queue / in-flight | not logged | ≤ 7 / ≤ 8, flat |
| non-contention | desk 1 | muon 24 (0.07 %) |
| boson share of all hops | 68.8 % | 58.0 % |
| desk clock | −88 ms | −119.1 ms (→ −132.9) |
| recount | failed, manual re-run | `RECOUNT_OK`, unattended |

## Fixes for a6
| Failure | Fix |
|---|---|
| **Phantom tip: a family freezes for good when its newest hop leaves the virtual UTXO set** (f2, f3, f4 one hop ahead of the live tip) | **Let a tip step back.** (1) Sender and coordinator keep the last 8 states per family. When `catchUp` from seq N finds nothing live at N or ahead (or times out twice in a row), probe `liveAt` for N−1 … N−8 in **one** `getUtxosByAddresses` call and take the newest live one, even if it is lower. Log `TIP_BACK family= from= to=` in phase.log. (2) `newest()` prefers a state **verified live** by the node (stamp `live_utc` on it) over a higher unverified seq. `markStale` on `orphan` (input not in the UTXO set or mempool) must also treat the cached tip as suspect, not just as old. (3) Coordinator: read `removedChainBlockHashes` from `getVirtualChainFromBlock`, drop un-accepted txids from `acc`, log `UNACCEPT family= seq=`, and run the backward probe at once. On STALL > 10 s, run the backward probe too, and log resync failures instead of swallowing them. (4) Senders write the shared state only from a live check |
| Prove the fix before a6 | **Rehearsal (5 min, 1 family, desk lane only, TN10)**: write a fake state one hop ahead (seq + 1, bogus txid) into `state/family-1.json` while the family runs, and check that it is back to landing hops in ≤ 5 s with a `TIP_BACK` line. Pass, then a6 |
| Orphans per running family ~3× a4 | Keep single-flight, but while a catch-up for that family is running, **skip** that family's tick (at most 250 ms) instead of submitting on a tip known to be stale. The other families keep every lane attempting every second. Measure: orphans per running family per 5 min should go back towards a4's ~420–540, and hops/s per family towards ~1.33 |
| Desk clock −119 ms and drifting −0.33 ms/min | Admin on the desk, once: `w32tm /config /manualpeerlist:"pool.ntp.org,0x8" /syncfromflags:manual /update`, a SpecialPollInterval of ≤ 900 s, then `w32tm /resync`. Add the clock to **preflight**: abort START if \|offset\| > 80 ms (headroom for drift over 50 min) |
| Desk RPC 97 ms (one sample) | Nothing to change on kaspad (hands off). Log node-watch rpc p99 per minute, and log the sender-side rpc of the desk lane next to it, so a spike can be matched to load. If stp wants "< 50 ms" read as p95 instead of the max, that is a dated PLAN change for him to decide; until then the max counts |
| `proc-desk.csv` written by two writers | Orchestrator log becomes `logs/proc-host-desk.csv` (with header); sender stays `proc-<lane>.csv` |
| Mini broker `EPIPE` crash at END | `builder-broker.mjs`: an `'error'` handler on every client socket, and close it quietly on STOP |
| Genesis keys empty (first a5 try aborted) | Preflight on the mini also checks that each genesis key has ≥ 1 coin of ≥ 15 tKAS before genesis |

## Recommendation for a6 (not run)
Same base (4 families, rate 5, 30 min, fresh genesis, 400 coins per lane, one builder per sender, option (a) share rule). Before starting: (1) the tip-step-back fix in sender + coordinator, with `UNACCEPT` / `TIP_BACK` logging, (2) the 5 min phantom-tip rehearsal passing, (3) the desk NTP fix plus the clock gate in preflight, (4) the skip-while-catching-up change for that family, (5) the `proc-host-desk.csv` rename and the broker `EPIPE` handler, (6) the genesis-key coin check. Pass bar: 10/10, with every family landing hops in every 5 min. Then the ladder moves on to Step 4 (4 families, 3× rate).

## Note: a5 rescored under the 30 Oct RPC change (record unchanged)
The PLAN now reads criterion 7 as node-watch RPC **p95 < 50 ms and max < 250 ms** (dated change, 30 Oct, after a5). Under that rule a5's criterion 7 would **pass**: desk p95 2 ms, max 97 ms (one sample, 13:25:44Z); mini max 3 ms. a5 would then count **8/10** (still failing criterion 1, desk clock −119.1 ms, and criterion 3, 96.61 % landing seconds). **a5's recorded result stays 7/10**: it was scored under the rule in force when it ran.
