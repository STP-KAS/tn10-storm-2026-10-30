> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a2 · 4 families · rate 5/family · 08:40:00–09:10:00 UTC

**a2 completed the full window.** The senders were not killed with the worker shell: they ran 08:40:00Z → 09:10:00Z and exited on their own at END (sender.mjs breaks at `END`; mini phase.log `STOP reason=END` 09:10:00Z). The desk phase.log simply has no END line because the desk orchestrator only logs up to launch/relaunch.

(a1 aborted before launch: `LAUNCH_ABORT reason=no_handoff`, the guard worked.)

## Timeline (UTC)
| Time | Event |
|---|---|
| 08:19:01 | desk receiver + node-watch up; guard test without file → REFUSED (exit 10) ✅ |
| 08:31:26–29 | mini genesis, 4 families included |
| 08:31:29.653 | handoff push ok, sha256 match both ends, 52 ms ✅ |
| 08:31:33 | guarded launch: broker + desk, mini, muon, boson |
| 08:31:43 | boson sender crashed at startup: `connect timeout` to its public node (lib.mjs `to()` unhandled at connect) |
| 08:33:31 / 08:35:15 | boson relaunched for "wrong_host": the orchestrator had `boson-10.kaspa.blue`, which does not resolve (DNS: no such host); the correct TN10 node is `wss://boson-10.kaspa.red/kaspa/testnet-10/wrpc/borsh`. The same wrong host was re-used in a3 and is now fixed in `desk-a3.ps1`. |
| 08:33:45 | broker crashed: unhandled socket `ECONNRESET` from the dying boson client |
| 08:34:30–43 | broker patched (`sock.on("error")`, kit3) and relaunched |
| 08:40:00 | all 4 lanes' first attempt within 0.18 s (desk/mini .227, boson .248, muon .402) ✅ |
| 09:10:00 | STOP reason=END; all senders exited cleanly |

Both start problems were before the counted window; nothing was lost in it.

## Lanes (all attempts inside the window)
| Lane | Node | Attempts | Submit ok | ok % | already_spent | orphan | submit rpc p50/p95/max ms |
|---|---|---|---|---|---|---|---|
| desk | desk local | 18,449 | 4,947 | 26.8 | 13,282 | 220 | 0/1/103 |
| mini | mini via tunnel | 23,354 | 5,835 | 25.0 | 17,182 | 337 | 2/52/106 |
| muon | public | 18,912 | 3,732 | 19.7 | 12,504 | 2,676 | 91/134/543 |
| boson | public | 19,091 | 5,277 | 27.6 | 12,907 | 907 | 18/58/443 |

No other reject reasons (no mass/fee/script rejects at submit).

## Chain result
Hops landed per family (state seq after END): f1 1,997 · f2 1,936 · f3 1,905 · f4 1,879 = **7,717 hops / 1,800 s = 4.29 hops/s** (29 Oct: 3.24). Desk and mini state agree within 1 hop.

## Nodes (node-watch every 5 s, full window)
| Node | Rows | synced | peers min | node-watch rpc max | mempool max | kaspad CPU / RAM max |
|---|---|---|---|---|---|---|
| desk | 359/360 | 100 % | 8 | 17 ms | 56 | 2.7 % / 8.6 GB |
| mini | 360/360 | 100 % | 8 | 3 ms | 64 | – |

Recovery: both nodes at mempool ≤ 5 from the first post-END row (09:10:04Z); later single spikes of 50–63 are TN10 background. ✅
Clock: desk −88.8 ms at launch, −91.0 ms after END (inside 100 ms, marginal); mini +50.5 / +43.0 ms.

## Against the pass criteria
| Criterion | Result |
|---|---|
| All lanes on every second | Lanes were up and attempting the whole window, but only **344/1,800 s** had a submit-ok from all four lanes in the same second ❌ (as a metric of "on") |
| ≥ 90 % accepted per lane | **❌ 20–28 %**. Structural: 4 senders race for the same covenant outpoint per family, so ~3 of 4 submits are `already_spent` by design. This criterion cannot pass in a contention run and needs redefining (e.g. non-contention rejects ≤ 10 %, or landed-hop share per lane). |
| Node RPC < 50 ms | ✅ node-watch (17/3 ms). Submit p95 over public muon 134 ms is network, not node. |
| Logs 1 row / 5 s, full window, desk + mini | ✅ |
| Recovery ≤ 5 within 10 min | ✅ immediate |
| Missing-29-Oct items | handoff auto-copy ✅, guard ✅, all four on together ✅, mini post-end clock ✅, full node-watch ✅; post-end mempool CSVs as separate files ❌ (data is in node-watch) |

## Raw logs (not in git; private dir holds submit JSONL, 35 MB)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a2\{logs,out,state,private\submit-*.jsonl}`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a2\{logs,out,state}`

## Re-scored against the 30 Oct criteria (PLAN dated change)
Scored with `tools/storm/score.mjs` (submit logs joined with the mini coordinator's landed-hop log; 7,701 of 7,701 in-window hops attributed to a lane).

| Lane | Attempting seconds (need 1,800) | Non-contention rejects (≤ 1 %) | Landed hops | Share (≥ 15 %) |
|---|---|---|---|---|
| desk | 1,144 ❌ | 0 % ✅ | 2,107 | 27.4 % ✅ |
| mini | 1,357 ❌ | 0 % ✅ | 544 | 7.1 % ❌ |
| muon | 1,164 ❌ | 0 % ✅ | 894 | 11.6 % ❌ |
| boson | 1,160 ❌ | 0 % ✅ | 4,156 | 54.0 % ✅ |

Seconds with ≥ 1 landed hop: **1,725 / 1,800 = 95.8 %** ❌ (need 99 %).

**a2 verdict: FAIL** on "attempt every second", "hops in 99 % of seconds" and the 15 % share (mini, muon). Rejects pass.

Causes found:
- **Idle seconds:** gaps of up to 4 s on every lane (8 s on desk late in the window). The sender's coin pool drops each spent funding coin and only refreshed every 5 s, so a lane with an empty pool sat idle. The desk lane (key 0) had only 9 funding coins left after a2 (others ~100), so its gaps grew in the last 15 min.
- **Low share for mini and muon:** they are the slow paths (mini via the tunnel, muon public with a 91 ms submit p50), so they lose the race for the same outpoint.
