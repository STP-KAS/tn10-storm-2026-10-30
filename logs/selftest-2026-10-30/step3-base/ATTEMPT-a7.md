> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a7 · 4 families · rate 5 · 30 min · **SCORED 10/10** (START 17:35:00Z, END 18:05:00Z, recovery to 18:25Z)

Changes vs a6: desk clock fixed (admin, see [RUNBOOK](../../../RUNBOOK.md) 6.5), `clock_gate: fail`; fire-on-new-tip senders (`tip_age_ms`, `fire`); `desk-a7.ps1` (pwsh 7 check, hard guard-refusal pre-check); scoring per the 30 Oct 18:06 CET dated change (plan 2b: no lane share rule, all shares reported). Mini side unchanged (kit6; hop-log revert marking not in this run). Fresh genesis, launch paths `…-s3a7-f1..4`.

## Launch (UTC)
| Time | Event |
|---|---|
| 17:07:29 | mini `PREFLIGHT_GENESIS exit=1`, `LAUNCH_ABORT reason=genesis_funding`: **false abort**: the repo copy of `mini-a6.ps1` has scrubbed default kit paths, so preflight never ran. Safe abort, nothing started |
| 17:07:39 | desk orchestrator (pwsh 7): `GUARD_PRE exit=2 refused=1` (guard refuses before the handoff, as required) |
| 17:08:17 | desk orchestrator restarted with explicit `-OldKit/-BuilderRoots` (same scrubbed-defaults issue: node-watch path). `GUARD_PRE exit=2 refused=1` again |
| 17:09:19 | mini relaunched with explicit `-Kit/-Kit30/-Kit6`: `PREFLIGHT_GENESIS exit=0` (4/4 genesis keys, 1 coin ≥ 15 tKAS each: top up before the next run) |
| 17:22:01 | handoff seen on desk; `PREFLIGHT exit=0`: desk 400 coins (20 ms), mini 398 (7 ms), muon 398 (203 ms), boson 369 (90 ms); **clock +4.8 ms, gate=fail, pass** |
| 17:22:03 | guard OK, `LAUNCH exit=0`, 4 senders, one builder each |
| 17:35:00 | START (12 min 57 s after ready) |

## First 2 minutes (17:35:00–17:37:00Z, desk submit logs)
| Lane | Attempts | Seconds attempting | ok | already_spent | orphan | other |
|---|---|---|---|---|---|---|
| desk | 2,300 | 120 / 120 | 658 | 1,134 | 508 | **0** |
| mini | 2,296 | 120 / 120 | 646 | 1,326 | 324 | **0** |
| muon | 2,176 | 120 / 120 | 574 | 1,259 | 343 | **0** |
| boson | 2,302 | 120 / 120 | 603 | 1,251 | 448 | **0** |

Highest tip seq per family after 2 min (f1 · f2 · f3 · f4): **154 · 155 · 164 · 162** = 635 hops ≈ **5.3 hops/s** (a6 at 2 min: ≈ 4.3). All families growing, no `TIP_BACK`, `STALL`, `SENDER_OFF` or `PROC_EXIT` on the desk. Scored after END: see below.

## Result: **10 / 10** (first 10/10 of the self-test)
Scored 30 Oct 2026 ~19:50 CET on the Grok Bot box (analysis only) with `tools/storm/score.mjs` (kit7, `SHARE_LANES` empty = plan 2b, all shares reported only). The raw logs were zipped read-only on the desk and the mini just before stp's desk restart and copied to the box. No process was started or stopped, kaspad was not touched.

**9,573 hops by recount = 5.32 hops/s** (a6 4.30, a5 2.93, a4 4.09). The hop log has 9,353 (5.20 hops/s), see flaw 1. No family froze: 3 `TIP_BACK` (f3 17:58:31Z, f2 17:58:53Z, f1 18:02:50Z), 941 `UNACCEPT`, 0 `STALL`, 0 `PROC_EXIT`, all sender `.err` files empty. Longest gap between any landed hops 1.59 s; longest per family 5.96 · 6.21 · 6.13 · **27.43 s** (f4, during a coordinator resync, the senders kept landing hops).

| # | Criterion | Result | Key number |
|---|---|---|---|
| 1 | Pre-checks: synced, peers ≥ 8, clock within 100 ms, disk ≥ 100 GB | **PASS** | desk clock **+5.0 ms** at preflight, **−1.1 ms** after END (stp's admin fix holds). Mini +51.4 / +15.3 ms. Both synced, 8 peers whole window. Free disk desk 435 GB, mini 313 GB (read at ~19:50 CET) |
| 2 | Every lane ≥ 1 attempt in each of 1,800 s | **PASS** | desk, mini, muon, boson 1,800 / 1,800 |
| 3 | Hops land in ≥ 99 % of seconds | **PASS** | **99.28 %** (1,787 / 1,800, from the hop log, so a lower bound). Missed per 5 min: 4 · 1 · 1 · 4 · 3 · 0 |
| 4 | Every reject is contention; non-contention ≤ 1 % per lane | **PASS** | 0 non-contention on all four lanes (133,812 attempts) |
| 5 | Desk lane: attempts every second + non-contention ≤ 1 % (plan 2b; share reported) | **PASS** | 1,800 s, 0 errors. Share **16.87 %** (1,578 / 9,353) |
| 6 | mini, muon, boson: attempts every second + non-contention ≤ 1 % (shares reported) | **PASS** | 1,800 s each, 0 errors. Shares mini 3.58 · muon 11.79 · boson 67.75 % |
| 7 | Node RPC p95 < 50 ms and max < 250 ms per node | **PASS** | desk p95 **14**, max **16** ms; mini p95 **2**, max **35** ms (node-watch, 360 rows each) |
| 8 | Logs 1 row / 5 s, full window, desk + mini | **PASS** | node-watch 360 / 360 rows each, max gap 5.02 / 5.06 s, 0 errors. Post-end mempool 240 rows each |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | desk mempool 5 at 0 s after END, mini 5 at 25 s. `RECOVERY_DONE` 18:25:11Z |
| 10 | 29 Oct items: handoff, guard, post-end, all lanes together, after-END recount | **PASS** | handoff sha256 ok 17:21:59Z; guard **refused before the handoff** (`GUARD_PRE exit=2 refused=1`, twice) then OK; all lanes from 17:35:00; **`RECOUNT_OK rows=4`** 18:25:10Z unattended |

### Lanes (window 17:35:00–18:05:00Z)
| Lane | Attempts | ok | contention | non-cont. | Landed | Share |
|---|---|---|---|---|---|---|
| desk | 34,509 | 9,818 | 24,691 | 0 | 1,578 | 16.87 % |
| mini | 34,442 | 9,619 | 24,823 | 0 | 335 | 3.58 % |
| muon | 32,638 | 8,772 | 23,866 | 0 | 1,103 | 11.79 % |
| boson | 32,223 | 8,421 | 23,802 | 0 | 6,337 | 67.75 % |

Sender-side `rpc_ms` (report only, not a criterion): desk p95 1 / max 13 ms, mini (tunnel) 44 / 102, boson 41 / 392, muon 132 / 366.

### Recount
f1 2,367 · f2 2,387 · f3 2,428 · f4 2,391 = **9,573** (recount.mjs on the mini, 18:06:07–18:06:16Z). Hop log f1 2,329 · f2 2,342 · f3 2,358 · f4 2,324 = 9,353; 0 revert lines.

### Flaws found (none fails a criterion)
1. **Hop log under-counts by 220 hops (2.3 %).** The coordinator logged 26 `resync` jumps (e.g. f4 seq 1141 → 1173) that skip 219 seqs in total without writing those hops. The recount walks the chain and finds them. So throughput and landing seconds from the hop log are lower bounds. Fix for the next kit: on resync, back-fill the skipped hops into `hops.jsonl` (with `seq`), so hop log = recount.
2. **`RECOUNT_OK` only checks row count** (4 rows), not agreement with the hop log. Fix: add a hop-log vs recount tolerance (e.g. ≤ 0.5 %) and print `RECOUNT_MATCH`/`RECOUNT_DIFF`.
3. Mini genesis keys had only 1 coin ≥ 15 tKAS each: top up before the next launch.
4. Repo copies of the mini/desk scripts have scrubbed default kit paths: always launch with explicit paths (RUNBOOK checklist).

### Next
Per PLAN: the **2-hour confirmation run of this exact setup**, which must also score 10/10, then 3× rate, then 8 families. **Not launched**: testing is paused (desk restart).
