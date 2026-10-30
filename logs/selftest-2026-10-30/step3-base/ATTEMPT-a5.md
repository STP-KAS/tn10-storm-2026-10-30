> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a5 · 4 families · rate 5/family · 13:10:00–13:40:00 UTC (RUNNING, not scored yet)

Fresh genesis (launch paths `…-s3a5-f1..4`, genesis window from 12:55Z), START 13:10:00Z, END 13:40:00Z, 20 min recovery to ~14:00Z.
Lane keys topped up from the Grok Bot TN10 wallet to **400 coins of 16 tKAS each** (8 txs, 0.14 tKAS fees) before preflight.

## Root cause found for a4's fade after 11:45 and the 81 s family-3 freeze
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

## Logs (not in git)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a5\{logs\phase.log, logs\proc-*.csv, logs\pool-*.csv, logs\clock-desk.csv, out\*, private\submit-*.jsonl, private\catchup-*.jsonl, private\builder-*.err}`, kit `kit5\`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a5\{logs\phase.log, logs\recount.csv, out\*, private\hops.jsonl, private\resync.jsonl}`
