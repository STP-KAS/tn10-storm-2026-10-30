> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Box run b2 · 4 families · rate 5 · 4 box lanes (muon, muon2, boson, boson2) · mini counts · START 21:00:00Z, END 21:20:00Z, recovery to 21:25Z

**Window completed. Score 7 / 10** (a7 criteria; box clock = known failure). Scored after the fact from the box and mini logs at ~21:30Z.

## What happened (UTC)
| Time | Event |
|---|---|
| 20:36:33–39 | Reconnect rehearsal: WebSocket of lane muon killed → `SENDER_OFF node_dead` 20:36:37 → **`RECONNECT_OK` in 379 ms** → `SENDER_ON` 20:36:39 |
| 20:37:43 | box health (5 s) + clock keeper (log only) started; agent keep-awake from 20:37:46 |
| 20:45:16–19 | GENESIS f1–f4 on the mini. Mini push logged `HANDOFF FAIL TypeError`; the handoff was copied to the box by the agent instead, imported exit 0 at 20:46:40 |
| 20:47:01 | box `PREFLIGHT exit=0`: 4 lanes pass (400 coins each); clock −626 ms (gate=log, known failure). 4 senders up 13 min before START |
| 21:00:00 | START (box and mini) |
| 21:03:19–21:04:14 | **mini kaspad lost all peers** (peers 8 → 0, synced 0, DAA frozen for ~55 s). Box senders kept submitting (~70 ok/10 s), but nothing landed in the mini's view. Coordinator `STALL` f1–f4 at 21:04:16, `STALL_END` 21:04:19, resync seq ~181 → ~238 on every family |
| 21:20:00 | END (both sides); senders exited by 21:21:00 (`left=0`) |
| 21:21:03–10 | mini recount f1–f4: 1,085 · 1,084 · 1,078 · 1,086 = **4,333** |
| 21:20–21:25 | mini mempool 5 at 0 s after END, stays 5–7 |
| ~21:24 | leftover b2 processes stopped by the scorer (box: orchestrator, health, clock keeper; mini: orchestrator, node-watch, post-end). kaspad untouched |

## Freezes and the interruption
- **No box freeze anywhere in the logged span 20:37:48–21:24Z**: box health has 549 rows, max gap **5.03 s**, freeze flag 0 throughout; CPU ≤ 22 %.
- The agent session holding the box awake was cut off at some point during or after the window, but the health log shows no gap, so the box stayed awake for the whole window plus recovery. Whatever cut the session did not suspend the box during b2.
- All four sender submit logs run continuously to END. All 4 families were live at END (state seq 1,078–1,086).

## Reconnect fix
Proven in the rehearsal (379 ms reconnect after a killed WebSocket). It was not needed in the run: no lane went `node_dead` between START and END.

## Score: **7 / 10**
| # | Criterion | Result | Numbers |
|---|---|---|---|
| 1 | Pre-checks incl. clock ≤ 100 ms | **FAIL (known)** | box clock −911 … −76 ms over HTTPS (NTP blocked). Mini +60.1 / +38.0 ms |
| 2 | Every lane ≥ 1 attempt in each of 1,200 s | **PASS** | 1,200 / 1,200 on all 4 lanes |
| 3 | Hops land in ≥ 99 % of seconds | **FAIL** | **92.83 %** (1,114 / 1,200 s; box attribution). Mini hop log 1,111 s. Cause: the 55 s mini peer loss at 21:03 plus a slower 21:16–21:19 |
| 4 | Non-contention ≤ 1 % per lane | **PASS** | 0 non-contention errors in 86,220 attempts |
| 5 | Box lanes: 0 errors | **PASS** | muon 21,991 · muon2 22,041 · boson 21,138 · boson2 21,050 attempts, 0 errors (the rest are `already_spent` / `orphan` contention) |
| 6 | Lanes attempt every second (+ shares reported) | **PASS** | as #2. Shares: boson2 34.5 · boson 30.7 · muon 21.4 · muon2 13.4 % |
| 7 | Node RPC p95 < 50, max < 250 ms (mini) | **PASS** | p95 **2** ms, max **2** ms, 239 rows, 0 errors (9 rows unsynced during the peer loss) |
| 8 | Logs 1 row / 5 s | **PASS** | mini node-watch max gap 5.07 s; box health max gap 5.03 s |
| 9 | Back to baseline ≤ 10 min | **PASS** | mini mempool 5 at 0 s after END |
| 10 | Recount vs hop log (0.5 % tol.) | **FAIL** | recount **4,333** vs hop log **4,028** (−7.0 %), vs box attribution 4,101 (−5.4 %). ~57 hops/family (≈ 228) were skipped by the 21:04 resync and never back-filled; the remaining ~77 (1.8 %) is the catch-up gap already seen in a7 |

Throughput: 4,333 hops (recount) = **3.61 hops/s** (b1 held segment 3.56, a7 5.32). Per minute ~215 hops except 21:03 (57) and 21:04 (146).

## Flaws found
1. **Mini kaspad peer loss** (21:03:19–21:04:14, 0 peers). It is on the node/network side, not the box; it alone costs criterion 3 and most of 10. The node was not touched (rule).
2. **Hop log is not back-filled after a coordinator resync** (same flaw as a7, bigger here). Fix in the mini coordinator: write the skipped seqs from the recount walk, or score #10 against recount + resync deltas.
3. Mini `handoff-push` TypeError (the desk receiver is not part of a box run); agent copy worked, sha check done on import.
4. Box clock stays a known failure (HTTPS offset swings ±0.8 s).
5. Orchestrators don't exit on their own when the agent session ends early; the scorer stopped them.

## Verdict
The box ran a full 20-min sender window with **0 freezes, 0 errors and every lane attempting every second**, the first box run to do so. The box is fine as a sender while awake. The 3 failures are the box clock (known), the mini node's 55 s peer loss and the hop-log back-fill.
