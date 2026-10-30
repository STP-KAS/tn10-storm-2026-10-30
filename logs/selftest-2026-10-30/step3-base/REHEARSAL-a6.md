> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# a6 rehearsal · phantom tip planted · 1 family · desk lane only · 14:35:00–14:40:00 UTC · **PASS**

Purpose (REVIEW "Fixes for a6"): prove that a family recovers when its shared state holds a tip **one hop ahead** of the live chain (the a5 freeze), before a6 starts.

Setup (desk, a6 code in `tools/storm/`): fresh genesis of one family on the desk node (14:32:56Z, launch path `…-reh6-f1`), the a6 coordinator on the desk node, one `desk` sender (`--source self`, own builder), rate 5/s. Preflight: lane pass (400 coins, wRPC 22 ms); clock gate `offset −140.9 ms, max 80, pass=0, gate=log, known_failure=1`.

At **14:36:31.657Z** `plant.mjs` overwrote `state/family-1.json` with seq 92 (live tip 91), a random txid and a random script: a tip that does not exist on the chain.

| Check | Result |
|---|---|
| `TIP_BACK` line | **14:36:32Z `TIP_BACK sender=desk family=1 from=92 to=91 why=timeouts`** (< 1 s after the plant) |
| First landed hop after the plant | **14:36:32.784Z**, 1.13 s after the plant (limit 5 s). Last hop before: 14:36:31.196Z |
| Attempts in the 3 s after the plant | 14, on tip seqs 91 / 92 / 93: the planted 92 was used for a moment, then dropped |
| Hops in the window | **300 in 300 s = 1.00 hops/s**, hops landed in 261 / 300 s (87 %, one lane only) |
| Attempts per minute | 274–276, ok 58–62, orphan 58–66, already_spent 148–158, other **0** in every minute (no change around the plant) |
| Catch-up timeouts / errors | 2 in 5 min (the two on the planted tip that triggered the step back) |

**New finding, `UNACCEPT`:** the a6 coordinator now reads `removedChainBlockHashes`. In 5 minutes with one family it logged **39 `UNACCEPT`** lines: the newest hop's accepting chain block was removed by a virtual-chain reorg. In all 39 the hop was accepted again by the next chain block (hops kept landing, no `TIP_BACK` needed by the coordinator). This is the mechanism behind a5's phantom tips: a reorg un-accepts the newest hop, and with four-way contention the reverted hop can lose for good, leaving the state one hop ahead.

Not tested in the rehearsal: the coordinator's own step back (it never needed one), and the multi-lane case (a6 tests that).

Raw (not in git): desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-reh6\{logs\phase.log, logs\reh.log, logs\preflight.log, private\submit-desk.jsonl, private\hops.jsonl}`.
