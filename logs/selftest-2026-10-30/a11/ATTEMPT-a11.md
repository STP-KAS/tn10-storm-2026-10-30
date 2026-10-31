# a11 — 2-hour run after the a10 fixes, Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- First slot (11:20–13:20Z) **aborted at 11:08Z before genesis** to apply the fixes (stp 12:07 CET, full authority). Logs kept as `step3-a11-abort1`.
- Fixes: mini kaspad graceful restart with `--ram-scale 0.4` (private 13.91 → 1.82 GB); KCC20 token output 0.2 → 1 tKAS (SDK storage mass 50,096 → 10,130); lanes funded by usable value. Details in RUNBOOK 13.
- Pre-START census 11:22Z: desk 1 own leftover, mini 0.
- Mini: `PREFLIGHT_GENESIS exit=0` 11:23Z, GENESIS families 1–4 included 11:49:55–11:49:58Z, handoff ok.
- Desk: preflight 11:50Z all lanes pass (desk 8,055 / mini 6,440 / muon 8,056 / boson 27,609 usable tKAS), clock −0.5 ms, `LAUNCH exit=0`.
- Window **12:00–14:00Z** (13:00–15:00 CET), tag s3a11b, 4 families, rate 5, lanes desk/mini/muon/boson. RBF sweep at END + 75 s / 3 min / 6 min, census 14:10Z.
- **START 12:00:00Z** (`START senders=desk,mini,muon,boson families=4 rate=5`).
- **Live hop mass (desk mempool, `mempool-diag.mjs`, 12:01Z):** our new hops storage mass **40,408–41,209**, compute 9,123 (old 0.2 tKAS hop: 200,586, the one pre-START desk leftover). About 5× lighter, as expected.

- **END 14:00:00Z** (15:00 CET), `SENDERS_EXITED left=0` 14:00:03Z. Sweep END+75 s: desk 8 own (7 replaced, 1 no live input), mini 6 own (6 replaced), 0 failed; END+3 min and +6 min: nothing left to replace. Census 14:10:07Z, `RECOVERY_DONE` 14:20Z on both. Nothing was stopped by hand; kaspad untouched on both machines (mini kaspad same process since 11:10Z).

## Result · scored Sat 31 Oct 2026, ~16:00 CET · **9/10**

`score.mjs` + `mempool-ours.jsonl`, logs copied read-only from desk and mini. Data: [data/](data/) (counts only, no ids).

| # | Criterion | Result | Numbers |
|---|---|---|---|
| 1 | Pre-checks (clock, sync, peers, disk) | PASS | desk clock −1.5 / −1.6 ms (11:22Z), −1.1 ms preflight, +1.8 ms after END; mini +20.0 ms (11:23Z), +14.0 ms after END (rule: within 100 ms); synced every row; peers 8 at preflight |
| 2 | Every lane every second | PASS | 4 of 4 lanes 7,200 / 7,200 s |
| 3 | Landing ≥ 99 % of seconds | **FAIL** | **98.92 %** (7,122 / 7,200), 78 missed seconds. Per 10 min: 8 4 3 6 10 9 10 6 4 3 5 10. **No freeze**: 60 of the 65 gaps are a single second, longest 4 s (5 gaps of 3–4 s) |
| 4 | Non-contention errors ≤ 1 % | PASS | muon 31 (0.02 %), boson 24 (0.02 %), desk 0, mini 0. Contention: desk 97,585, mini 97,475, muon 96,014, boson 96,982 |
| 5 | Desk lane | PASS | attempts every second, 0 errors; share 4.26 % (reported) |
| 6 | Other lanes | PASS | shares mini 12.88 %, muon 17.59 %, boson 65.27 % (reported) |
| 7 | Node RPC p95 < 50 ms, max < 250 ms | PASS | desk p95 5, max 17 ms; mini p95 2, max 16 ms. **No desk spike.** Sender RPC max: desk 28, mini 140, muon 876, boson 376 ms |
| 8 | Logs every 5 s | PASS | 1,438 rows each in the window, max gap 5.018 / 5.049 s, 0 node-watch errors |
| 9 | 0 own tx at END + 10 min (new since START) | PASS | 14:10:07Z: desk 1 own (0 new, 1 pre-START), mini 0. **New 0 · strict 1** (the one desk leftover with no live input, already there at 11:22Z) |
| 10 | Handoff, guard, post-end, recount | PASS | `GUARD_PRE exit=2 refused=1`, `HANDOFF ok`, preflight 0, `RECOUNT_OK rows=4`, `RECOUNT_MATCH hoplog=38971 recount=38975 diff_pct=0.010` |

**Hops:** recount **38,975 = 5.41 hops/s**, the best 2-hour rate so far (f1 9,737 · f2 9,803 · f3 9,739 · f4 9,696); hop log 38,999 lines, 38,971 unique, 479 back-fill, 74 resync, 0 revert. Landed per 10 min (hops/s): 5.06 5.51 4.91 4.41 5.54 5.46 5.58 5.59 5.60 5.49 5.52 5.54. The 12:20–12:40Z dip lines up with the TN10 DAA rate at 9.24–9.30/s and the mempool peak (desk 260, mini 227).
**Freezes / stalls:** 0 `STALL`, 0 `PROC_EXIT`, 0 `SENDER_OFF`. **Mini kaspad did not freeze** (no low-DAA row on either node; mini kaspad working set 2.6–3.6 GB, private 4.1 GB at 14:47Z, free RAM 2.8 GB, free commit 6.3 GB). 270 `TIP_BACK` (all `why=timeouts`, the 4 senders of one family together), 3,959 `UNACCEPT`. Longest all-family gap 4.9 s (13:59:52Z); single family f3 15.6 s at 12:01:37Z (start resync timeouts).
**Pools (coins > 3 tKAS, start → min → end):** desk 783 → 562 → 671, mini 594 → 72 → 72, **muon 732 → 8 (13:59:39Z) → 59**, boson 2,335 → 889 → 889. 18 `POOL_LOW` lines (muon 14 from 13:50Z, mini 4 from 13:58Z); no lane missed a second, but muon was minutes from running dry. Usable tKAS used in 2 h: boson ≈ 24,600 of 27,609, muon ≈ 7,550 of 8,056, mini ≈ 5,600 of 6,440, desk ≈ 1,770.

### What failed and why
- **Criterion 3 (98.92 %, 6 seconds short of 99 %) is a network floor, not a freeze.** The 78 empty seconds are spread evenly (3–10 per 10 min), 60 of them single seconds, and the second after an empty one carries **6.06 hops on average vs 5.21 overall**: our hops were ready and landed together one second later, so in those seconds no accepting chain block took any of the 4 families. Only 18 of the 78 are within 5 s of a `TIP_BACK`. Counting by `seen_utc` instead of the accepting header time gives the same 98.93 %. History: a7 99.28, a8 99.49, a9 99.32, a10 98.85 (freeze), a11 98.92. With 4 families at ≈ 5.4 hops/s the 99 % line sits inside the run-to-run noise. Options for stp (no rule change made): keep 99 % and rerun; or a dated change to the landing rule; or more families (part of the scaling ladder, blocked until 10/10).

### What worked
- The a10 fixes: **mini kaspad restart** (no freeze, memory stayed low), **1 tKAS token** (mass ≈ 41 k, best rate 5.41 hops/s), **RBF sweep** (14 own losers at END+75 s, all live ones replaced, 0 new left at the census), no desk RPC spike.
