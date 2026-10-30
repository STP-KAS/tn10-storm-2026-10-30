> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a8 · 2-hour confirmation of the a7 setup · 4 families · rate 5 · 120 min

Purpose: stp's rule — after the first 10/10 (a7), the same setup must also score 10/10 over **2 hours** before any scaling.
Same as a7: lanes desk, mini (tunnel), muon, boson; one builder per sender, catch-up cap 2 s, tip step-back, fire-on-new-tip, `clock_gate: fail` (80 ms), same 10 criteria (plan 2b, no share rule). The box is **not** part of the run.

Changes vs a7 (measurement only, mini side, kit8 = kit6 + 2 fixes):
1. **Hop-log back-fill** (`coordinator.mjs`): a resync that jumps from seq N to M now writes the skipped hops N+1…M−1 as `source:"backfill"` lines (seq, no txid, no accept time: those coins are spent) and the tip M as a `source:"resync"` hop. Every hop line carries `seq`. `score.mjs` counts back-fill hops (`hops_backfill`) but never uses them for landing seconds.
2. **Recount tolerance** (`recount.mjs`, `mini-a8.ps1`): after the recount, hop log (unique family+seq) vs recount; ≤ 0.5 % → `RECOUNT_MATCH`, else `RECOUNT_DIFF` (phase line + `logs/recount-check.txt`).
3. Run dirs from `mk-run8.ps1`; all kit paths passed explicitly (`-Kit/-Kit30/-Kit6`, `-Kit/-OldKit/-BuilderRoots`).

## Preflight (30 Oct, UTC)
| Time | Check | Result |
|---|---|---|
| 22:58 | desk kaspad running (since the desk restart), not touched | up |
| 22:58 | desk clock (`w32tm /stripchart`, 3 samples) | **+0.9 / +1.0 / +0.7 ms**; `MaxAllowedPhaseOffset` still 0 after the reboot, no re-fix needed |
| 22:59 | desk tunnel end restarted (the desk reboot had killed it; mini end was still dialing) | legs listening |
| 22:59 | desk node and mini node (via tunnel): `synced true`, testnet-10 | pass |
| 23:00 | mini genesis keys: 1 coin ≥ 15 tKAS each | topped up to **4 each** (1 tx, 12 × 20 tKAS, fee 0.0066 tKAS, Grok Bot TN10 wallet) |
| 23:13 | rehearsal 1 desk preflight: **boson lane key had 3 usable coins** (spent down by the box runs b1/b2) | `PREFLIGHT exit=20`, `LAUNCH_ABORT reason=preflight` (safe abort, no sender started) |
| 23:15–23:28 | lane top-up to 400 coins of 16 tKAS | boson +397, muon +11, mini +3 (11 txs, fees ≈ 0.12 tKAS); after: 400/400/400/400 |

## Rehearsal 2 (`reh8b`, 6 min, 23:36–23:42Z, same lanes, 4 families)
- Desk: guard refused before the handoff, `PREFLIGHT exit=0` (all lanes 400 coins, clock +1.1 ms), `LAUNCH exit=0`, `SENDERS_EXITED left=0`.
- Mini: 2 resyncs (f4 199→206, 355→362) → **12 back-fill + 2 resync hop lines** written.
- `RECOUNT_OK rows=4` and **`RECOUNT_MATCH hoplog=1833 recount=1837 diff_pct=0.218`** (a7 would have been 2.3 % off). 1,837 hops / 360 s = 5.10 hops/s.

## Launch
| | UTC | CET |
|---|---|---|
| orchestrators started (desk pwsh 7, mini detached) | 23:47 | 00:47 |
| genesis / family check | 23:57 | 00:57 |
| **START** | **00:05 (31 Oct)** | **01:05** |
| **END** | **02:05** | **03:05** |
| recovery + recount done | ~02:25 | ~03:25 |

Mini `PREFLIGHT_GENESIS exit=0`; desk `GUARD_PRE exit=2 refused=1` (refuses before the handoff, as required). Result: see below once scored.
