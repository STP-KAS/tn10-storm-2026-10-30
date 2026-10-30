> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a3 · 4 families · rate 5/family · 10:05:00–10:35:00 UTC

**a3 ended cleanly but FAILS.** Senders ran the full window and exited at END (`END reason=window` 10:35:00Z, `SENDERS_EXITED left=0` 10:35:04Z); recovery logging finished at 10:55:11Z (desk) / 10:55:12Z (mini). No a3 processes were left running on either machine. Families were reused from a2 (`MAIN reason=reuse_a2_families`).

## Timeline (UTC)
| Time | Event |
|---|---|
| 09:31:41 | desk receiver + node-watch up |
| 09:32:53 | mini handoff push ok, sha256 match, 52 ms ✅ |
| 09:34:03 | desk orchestrator restarted (`ps5_native_stderr_stop`: PS 5.1 turned node's stderr into a stopping error) under pwsh 7 |
| 09:34:06–11 | guard OK, LAUNCH, START line |
| 09:34:11 | **void `END reason=window`** (see anomaly 1) |
| 09:35:16 | orchestrator restarted again (`pwsh7_json_dates`), monitor attached |
| 10:05:00 | window opens; desk, mini, muon attempting; **boson not attempting** |
| 10:05:01 | `PROC_EXIT pid=18660 before_end` = first boson sender (anomaly 2) |
| 10:07:51 | boson relaunched on the right host; first boson attempt 10:07:52 |
| 10:10:56 | last hop written to the mini coordinator's landed-hop log |
| 10:11:57 | mini coordinator `STALL family=4` → `STOP reason=STALL` (anomaly 4) |
| 10:16:40–51 | `SENDER_OFF sender=muon reason=node_dead` → `SENDER_ON` (anomaly 3) |
| 10:35:00 | END; all senders exited by 10:35:04 |
| 10:55 | 20 min recovery logging done |

## Lanes (all attempts inside the window, from the submit logs)
| Lane | Attempts | Submit ok | Contention rejects | Non-contention | Attempting seconds (need 1,800) | Landed share* |
|---|---|---|---|---|---|---|
| desk | 13,909 | 2,302 | 11,607 | 0 | 1,663 ❌ | 40.1 % |
| mini | 33,755 | 4,242 | 29,513 | 0 | 1,800 ✅ | 4.4 % ❌ |
| muon | 33,539 | 3,450 | 30,089 | 0 | 1,790 ❌ | 15.2 % ✅ |
| boson | 12,979 | 1,859 | 11,120 | 0 | 1,397 ❌ | 40.3 % |

\* Share is only measurable for 10:05:00–10:10:56 (1,578 hops, all attributed), because the hop log stopped at the STALL.

Submit-ok per 10 min (desk lane): 1,326 → 614 → 235 → 128 (last 10 min incl. tail). Boson: 554 (from 10:07:52) → 968 → 228 → 110. Mini and muon stayed flat. The desk lane missed 137 single seconds, all after 10:12; boson missed 172 s at the start plus ~59 single seconds later.

## Chain result
- Hop log (independent, mini coordinator): 1,578 hops in 10:05:00–10:10:56 = **4.43 hops/s**; hops landed in 351/356 s (98.6 %).
- Whole window, from the desk senders' end state (seq delta per family from the a2 tip): f1 1,125 · f2 1,063 · f3 1,074 · f4 1,005 = **4,267 hops / 1,800 s ≈ 2.37 hops/s** (a2: 4.29). Not independently counted: the coordinator was stopped for the last 23 min.
- So the rate fell from ~4.4 hops/s to ~1.9 hops/s after about 10:11, in step with the desk and boson lanes running out of submit-ok capacity.

## Nodes (node-watch every 5 s)
| Node | Rows in window | synced | peers min | rpc max / p95 | mempool max | kaspad CPU / RAM max |
|---|---|---|---|---|---|---|
| desk | 359/360 | 100 % | 8 | 38 / 2 ms | 54 | 2.7 % / 7.3 GB |
| mini | 359/360 | 100 % | 8 | 19 / 2 ms | 57 | 14.6 % / 5.8 GB |

No node-watch errors and no gaps > 7 s; nothing unusual at 10:16 on either node.
Recovery: desk mempool 2, mini 0 at the first post-END row ✅. Post-end mempool CSVs now exist on both nodes (240 rows each, 20 min; max 53 / 51 = TN10 background spikes; post-end rpc max 29 / 36 ms) ✅.
Clock: desk −87.6 ms at launch, −88.2 ms after END (inside 100 ms, marginal); mini +6.0 / +46.9 ms.

## Anomalies and root causes
1. **Void END line (09:34:11Z).** `desk-a3.ps1` line 5 does `[DateTimeOffset]::Parse($cfg.end_utc)`. Under pwsh 7, `ConvertFrom-Json` already turns ISO strings into `[DateTime]`; it gets stringified in the local culture (`10/30/2026 10:35:00`) and `Parse` throws (`out/orch2.err`). `$END` stayed empty, so the wait loop fell straight through and logged END. Fix: `ConvertFrom-Json -DateKind String` (pwsh 7.5+) or use `$cfg.end_utc` as `[DateTime]` directly with `.ToUniversalTime()`. The restart at 09:35:16 fixed it for the real run. Harmless for the counts.
2. **`PROC_EXIT pid=18660 before_end` (10:05:01Z) + boson `RELAUNCH dns_no_such_host`.** pid 18660 was the first boson sender. The committed `desk-a3.ps1` (a6bb233) still had `boson-10.kaspa.blue`, which **does not exist** (desk DNS: "DNS name does not exist"). `boson-10.kaspa.red` resolves and is the real public TN10 node: boson submitted 12,979 times through it. `.red` is not a typo; `.blue` was. The new connect retry (7 retries, up to 30 s back-off) hid the DNS failure as `connect timeout` and the sender died at 10:05:01 when the retries ran out. The orchestrator relaunched it on `.red` at 10:07:51 → boson lost the first 172 s. The fix in `desk-a3.ps1` was made on the desk during the run and is committed with this write-up.
3. **muon `SENDER_OFF node_dead` 10:16:40–51Z.** Only the public muon link: both our nodes were healthy (desk rpc ≤ 3 ms, mempool 2–4 at 10:16). The sender's health probe failed against muon, it stopped submitting for 7 s (10:16:45–51) and came back by itself. Cause on muon's side (public node / WebSocket path), not ours; it costs muon 10 attempting seconds.
4. **Mini coordinator STALL (10:11:57Z), the biggest problem.** The coordinator saw no hop for family 4 after 10:10:50. Its resync (`catchUp`, 5 s timeout) did not find the new tip in time, so after `stall_s=60` it declared STALL, wrote `control\STOP` on the mini and exited, and the mini's builder broker exited with it (`builder exit 0`). The senders run on the desk and kept going, so the chain did **not** stall (family 4 went on to seq 2,884 on the desk). Only the independent landed-hop log ended. Root cause: under four senders, the coordinator falls behind (`resync ... seq +4..+7` dozens of times in `coord.err`), and the virtual tip-walk for the slowest family took more than 5 s. A monitoring-only process is allowed to stop the run's evidence.
5. **Desk and boson lane fade (desk from 10:12, boson from ~10:20).** Their submit-ok counts collapsed and they got idle seconds, while mini and muon stayed flat, and there were no rejects other than contention. That matches funding-coin starvation: a2 left the desk lane's key with only 9 funding coins, and the a2 pool-refill fix only refetches. It cannot create coins. Boson's key probably went the same way after it joined late. Counts of coins per key were not read after the run (no RPC to kaspad in this review); check them read-only before a4.
6. **Minor:** desk, muon and boson stderr show `broker closed` / `ECONNREFUSED 127.0.0.1:17320`, and mini shows one `script failed: verification failed`. These are pre-submit errors and are **not** in the submit logs, so "0 % non-contention" is only true for submits. The broker-closed lines have no timestamp. The submit logs show the three lanes submitting until END, so they most likely came from the broker closing at END. Timestamp them in a4.

## Raw logs (not in git)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a3\{logs,out,state,private\submit-*.jsonl}`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a3\{logs,out,state,private\hops.jsonl}`

Scored with `tools/storm/score.mjs` (submit logs → csv, joined with the mini's landed-hop log).
