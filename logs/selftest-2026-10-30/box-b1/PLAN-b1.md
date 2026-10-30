> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Box run b1 · plan and why

**Why.** stp is gaming on the desk (30 Oct evening), so the desk is untouched: no commands, no senders, no receiver. Instead of waiting, b1 tests **the Grok Bot box as the only sender machine**, while **the mini counts** exactly as in a7 (coordinator, fresh genesis, hop log, after-END recount, node-watch, post-end). The box has frozen in earlier runs; b1 measures whether it holds a full 30-min contention run, with a health row every 5 s.

**Goal (stp: "do whatever you want, make it work, full load, try 10/10").** Score 10/10 on the a7 criteria: every lane attempts in each of 1,800 s, non-contention errors ≤ 1 % per lane, hops land in ≥ 99 % of seconds, node RPC p95 < 50 ms and max < 250 ms (mini node), clock gate on the box (|offset| ≤ 80 ms), logs 1 row / 5 s, recovery ≤ 10 min, `RECOUNT_OK`. Load starts at a7's (4 families, rate 5) with **4 box lanes instead of 3 public ones**; it is scaled only after a clean pass. If the box freezes, it is logged and the run keeps going.

## Setup (differences vs a7)
| Item | a7 | b1 |
|---|---|---|
| Sender machine | desk (4 lanes) | **box** (4 lanes) |
| Lanes | desk node, mini (tunnel), muon, boson | **muon, muon2, boson, boson2** (two own keys per public node) |
| Mini lane | via reverse tunnel to the desk | **not possible**: the tunnel ends on the desk; the mini node is localhost-only and the box is not reachable from the mini |
| Handoff | mini pushes to the desk receiver | mini exports `handoff.json`; it is **copied to the box by the agent** (chain-public data only), the box script waits for it, imports, then preflight |
| Builder | kcc20.exe, one per sender | Linux `kcc20`, one per sender (`STORM_BUILDER_DIRECT=1`) |
| Clock | desk w32tm (fixed by stp) | box: UDP 123 blocked → **HTTPS fallback** in `clock-offset.mjs`; box clock found −942 ms and drifting; a **clock keeper** steps it every 2 min when |offset| > 40 ms (`CLOCK_STEP` in phase.log) |
| Health | proc CSV on desk | `health-box.csv` every 5 s: cpu %, load1, mem available, gap_ms (logger's own timestamps; freeze=1 if gap > 7 s), sender count |
| Detach | Start-Process | `setsid nohup` (no systemd on the box) |

Schedule (UTC): genesis on the mini from 18:52, START **19:20:00Z**, END **19:50:00Z**, recovery to 20:10Z. Fresh launch paths `…-b1-f1..4`.

Funding (Grok Bot TN10 wallet, sign only): box lane keys topped up to 400 coins of 16 tKAS each (28 txs, 0.504 tKAS fees; one new lane key created for muon2), mini genesis keys 3 coins of 16 tKAS each (1 tx).

## Flaw fixes from a7
- Hop-log back-fill on resync: **not done** (the coordinator's catch-up returns only the tip, so back-fill needs a chain walk per resync; not quick or safe to add mid-evening). Mini code unchanged (kit6).
- Recount vs hop-log check: done **in scoring on the box** (analysis only): `recount ≈ hop log + resync-skipped seqs`, tolerance 0.5 % → `RECOUNT_MATCH` / `RECOUNT_DIFF`.

## Known limits
- No node lane on the box: all 4 lanes go over public WebSockets, so sender `rpc_ms` is report-only (the RPC criterion is on the mini node, as in a7).
- The box clock steps (keeper) create small gaps/overlaps in box timestamps; they are logged.
