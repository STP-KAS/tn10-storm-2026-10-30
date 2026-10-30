> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a7 · 4 families · rate 5 · 30 min · **RUNNING** (START 17:35:00Z, END 18:05:00Z, recovery to 18:25Z)

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

Highest tip seq per family after 2 min (f1 · f2 · f3 · f4): **154 · 155 · 164 · 162** = 635 hops ≈ **5.3 hops/s** (a6 at 2 min: ≈ 4.3). All families growing, no `TIP_BACK`, `STALL`, `SENDER_OFF` or `PROC_EXIT` on the desk. Full score after END by the scoring routine.
