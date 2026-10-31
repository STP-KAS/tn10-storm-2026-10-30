# a10 — 2-hour confirmation (same setup as a9), Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Window **07:45–09:45Z** (08:45–10:45 CET), family check 07:37Z, tag s3a10b, 4 families, rate 5, lanes desk/mini/muon/boson, same lanes and keys as a9.
- New: criterion 9 = own-tx census at END + 10 min (09:55Z), `desk-a10.ps1` (kit10), `mempool-ro.mjs` with `--pre` baseline taken 06:41Z: **3 own tx (desk), 6 (mini) already stuck before START** (a9 leftovers, RUNBOOK 11).
- Prep: genesis keys 4 coins ≥ 15 tKAS each; lanes 600/600/600/800; `clock-offset.mjs` fix deployed.
- Mini orchestrator first try aborted at 06:41Z (`LAUNCH_ABORT reason=genesis_funding`: the genesis top-up had run dry, without `send`); relaunched 06:48Z after funding, `PREFLIGHT_GENESIS exit=0`.
- **First slot (07:15Z) aborted** at 07:07Z: `PREFLIGHT exit=20`, boson usable 4,705 tKAS < 8,600 (800 coins but many small after a9). Boson topped up to 1,120 coins (+320 × 16 tKAS, ~8,865 usable). Both orchestrators and their child processes stopped (never kaspad), aborted run dirs kept as `step3-a10-abort`, fresh run dirs, relaunched 07:12Z for the 07:45Z window. The 07:07Z genesis of the first slot used 1 genesis coin per key (3 left each).
- Lesson (RUNBOOK 11): the funding target must count usable value, not coins; `fund-lanes` should top up to `usable_min_tkas`.
- **START 07:45:00Z** (08:45 CET): preflight exit 0 (07:37:12Z), guard 0, LAUNCH 07:37:21Z, all 4 senders, 4 families, rate 5. Normal TIP_BACK at 07:45:50Z (family 3, recovered).

- **END 09:45:00Z** (10:45 CET), senders exited 09:45:03Z, criterion-9 census 09:55:07Z, `RECOVERY_DONE` 10:05:13Z (desk) / 10:05:15Z (mini).

## Result · scored Sat 31 Oct 2026, ~11:15 CET · **7/10**

`score.mjs` (fixed, see RUNBOOK 12) + `mempool-ours.jsonl`. Data: [data/](data/) (counts only, no ids).

| # | Criterion | Result | Numbers |
|---|---|---|---|
| 1 | Pre-checks (clock, sync, peers, disk) | PASS | desk clock +2.0 / +1.9 ms (07:12Z), preflight +8.9 ms, +1.4 ms after END; mini +16.2 / +14.4 ms; synced every row, min 8 peers; disk free desk ≈ 452 GB, mini ≈ 331 GB |
| 2 | Every lane every second | PASS | 4 of 4 lanes 7,200 / 7,200 s |
| 3 | Landing ≥ 99 % of seconds | **FAIL** | **98.85 %** (7,117 / 7,200). Missed seconds per 10 min: 3 1 4 3 6 10 1 1 9 7 10 **28**; 25 of them are 09:44:35–59Z (mini node freeze, below). Without those ≈ 99.19 % |
| 4 | Non-contention errors ≤ 1 % | PASS | muon 58 (0.04 %), boson 57 (0.04 %), desk 0, mini 0; all `rejected rpc` (public-node WebSocket). Contention: already_spent 306,119, orphan 91,274 (all lanes) |
| 5 | Desk lane | PASS | share 9.76 % |
| 6 | Other lanes | PASS | mini 4.86 %, muon 11.90 %, boson 73.48 % |
| 7 | Node RPC p95 < 50 ms, max < 250 ms | **FAIL** | desk p95 3 ms, **max 1,785 ms** (09:33:22Z; desk DAA stood still 09:33:17–22Z, kaspad-internal); mini p95 2, max 16 ms. Sender RPC max desk 1,369, mini 1,677 ms |
| 8 | Logs every 5 s | PASS | 1,438 rows each, max gap 5.017 / 5.049 s |
| 9 | 0 own tx at END + 10 min | **FAIL** | 09:55:07Z: desk 10 own (8 new since START, 2 pre-START), mini 17 own (14 new, 3 pre-START). **Strict 27 · new 22 · a9 leftovers still there 5 of 9** |
| 10 | Handoff, guard, post-end, recount | PASS | `GUARD_PRE exit=2 refused=1` before the handoff, `HANDOFF ok` 07:36:59.996Z (sha256 checked), preflight 0, `RECOUNT_OK rows=4`, `RECOUNT_MATCH` diff 0.311 % (tol 0.5 %) |

**Hops:** recount **36,606 = 5.08 hops/s** (f1 9,182 · f2 9,158 · f3 9,125 · f4 9,141); hop log 36,522 lines, 36,492 unique, 455 back-fill, 74 resync, 0 revert. Per 10 min: 5.22 5.18 5.11 5.19 5.10 5.13 5.21 5.21 4.79 4.85 4.74 4.38 — the fade from ≈ 09:05Z lines up with the TN10 DAA rate dipping to ≈ 8.8/s (09:17–09:27Z) and the foreign mempool rising (mini up to 786 in the window, 2,075–2,232 just after END).
**Freezes:** 0 `STALL`, 0 `PROC_EXIT`, 0 `SENDER_OFF`, **0 `POOL_LOW`**. TIP_BACK desk 156, mini 25; 4,290 `UNACCEPT`. Longest gap all families 4.54 s (08:43:02Z), single family f1 15.0 s (08:01:01Z).
**Pools (coins > 3 tKAS, start → min → end):** desk 600→348→445, mini 600→477→571, muon 600→438→516, boson 1,120→285→349. Attempts: desk 137,746, mini 137,522, muon 130,560, boson 137,630.
**Mempool (all txs):** before START desk 55, mini 676; desk after END 62–120.

### What failed and why
- **Criterion 3 — mini node freeze at the very end.** Mini kaspad DAA stood still 09:44:37–09:45:17Z (40 s), RPC timeout 4,007 ms at 09:45:22Z. The coordinator (counting node) logged no hops for the last 25 s, resync `back_error` 09:44:57–09:45:00Z. Cause: memory pressure on the mini — kaspad 14 GB private / 4.7–5.9 GB working set on a 12 GB machine, commit 21 of 22 GB, ≈ 1 GB free (kaspad up since 23 Oct). Fix needs stp (kaspad restart, reboot or more RAM); not allowed to the agents.
- **Criterion 7 — desk RPC spike 1,785 ms at 09:33:22Z,** desk kaspad DAA frozen 5 s. Single kaspad-internal hiccup; nothing in our code. Same class as the mini freeze.
- **Criterion 9 — stuck race losers** (root cause and fix: RUNBOOK 12). Verified 10:25Z (1 h 40 min after END, all 27 still there = they never expire): one `sweep-ours.mjs --apply` pass (19 replacements, 0 failed) took the census from **desk 10 / mini 17 to desk 1 / mini 2** (new-since-START 22 → 2, which is one and the same tx on both nodes; pre-START 5 → 1). The 3 left have no live input any more, so nothing can replace them (RUNBOOK 12).

### What worked
- Window-sized funding (usable value): no `POOL_LOW` over 2 h, boson lowest 285 coins.
- Guard refusal before the handoff, handoff, preflight, recount agreement, clock (all rows well inside ±20 ms).
- 2 h with no family freeze and no sender exit.

## Next: a11 (launched 31 Oct 2026, 11:34 CET)
Same 2-hour setup (4 families, rate 5, lanes desk/mini/muon/boson, kit10 + `desk-a11.ps1` with the after-END RBF sweep; mini `mini-a8.ps1` with kit8). Lanes funded to usable value, genesis keys 4 coins each, pre-START census desk 1 / mini 2 own (no live input, cannot be swept). Family check 11:10Z, **START 11:20Z (12:20 CET), END 13:20Z (14:20 CET)**, sweep END + 75 s / 3 / 6 min, criterion-9 census 13:30Z (14:30 CET). The mini memory problem is not fixed (needs stp), so criterion 3 can fail the same way.
