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
| 08:33:31 / 08:35:15 | boson relaunched (logged "wrong_host"; endpoint is `wss://boson-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh`) |
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
- desk `C:\Users\Remco\tn10-storm-2026-10-30\step3-a2\{logs,out,state,private\submit-*.jsonl}`
- mini `C:\Users\sremc\tn10-storm-2026-10-30\step3-a2\{logs,out,state}`
