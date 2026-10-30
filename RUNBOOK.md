> Kaspa Testnet-10 only. Internal self-test, no Pulse. Fall-back guide for future runs.

# RUNBOOK · every problem from a1 to a7 and how it was solved

Each entry: **symptom → cause → fix → how it was verified → commit.** Times are UTC. Details live in the ATTEMPT files under [`logs/selftest-2026-10-30/step3-base/`](logs/selftest-2026-10-30/step3-base/).

## 1. Hosts and lanes

**1.1 Boson lane missing (a2/a3).** Symptom: boson lane sent nothing for minutes (a3: 172 s missed). Cause: the wrong public host was committed and reused (`boson-10.kaspa.blue`). Fix: boson is **`boson-10.kaspa.red`**; muon stays `muon-10.kaspa.blue`. Lanes now live in the run config, and preflight checks DNS + wRPC connect + synced per lane. Verified: a4–a6 boson attempted 1,800/1,800 s. Commit `3f567aa`, preflight `1534726`.

**1.2 Public node flaps (a3).** Symptom: muon dropped for ~7–11 s. Cause: public WebSocket path, not our nodes. Fix: `node_dead` only after 3 failed health probes in a row; connect retry with backoff. Verified: a4+ no false `SENDER_OFF`. Commits `a6bb233`, `1534726`.

## 2. Coins and funding

**2.1 Lane pools ran dry (a2).** Symptom: 4 s gaps, lanes fading. Cause: too few funding coins per lane key. Fix: top up each lane key to **400 coins of 16 tKAS** from the Grok Bot TN10 wallet (a5: 8 txs, 0.14 tKAS fees in total); preflight refuses a lane with **< 200 coins**; pool size logged every 5 s (`pool-<lane>.csv`); pool refresh on empty. Verified: a5/a6 no lane gaps from funding. Commits `a6bb233`, `1534726`, `dfafd66`.

**2.2 Genesis keys empty (first a5 launch).** Symptom: `LAUNCH_ABORT`/`no_funding`, handoff push `http_422_not_handoff`, guard never let senders start (safe abort). Cause: the mini's 4 genesis keys (separate from lane keys) had no coin ≥ 15 tKAS left after a4. Fix: 3 coins of 16 tKAS per genesis key (1 tx), relaunch; **preflight `--genesis`**: every family key needs ≥ 1 coin ≥ 15 tKAS, else abort. Verified: a6 `PREFLIGHT_GENESIS exit=0` (4/4 keys). Commits `dfafd66`, `394ad0c`.

## 3. Coordinator and hop log

**3.1 Hop counter stopped itself (a3).** Symptom: hop log ended after ~7 min (coordinator STALL), rest of the window unmeasured. Cause: coordinator stopped on STALL. Fix: **STALL is logged only**, the coordinator never stops; async 30 s resync; after-END independent recount (`recount.mjs`, own builder). Verified: a5/a6 `RECOUNT_OK`. Commits `1534726`, `c55307b`.

**3.2 Hop log counts reverted hops (a6, +2 of 7,734).** Cause: coordinator writes a hop, a reorg reverts it, it writes the replacement too. Fix (planned, mini bot, kit6+): `seq` on every hop line + `revert_of` lines; score skips reverted hops. Status: **open**, not in a7. Commit `333b754` (plan).

## 4. Sender throughput

**4.1 Fade after ~15 min (a4).** Symptom: hops/s sank during the run. Cause: every lost race forced a full tip lookup and all senders queued on **one shared builder** → pile-up. Fix: **one builder per sender** (`STORM_BUILDER_DIRECT=1`, own root per lane). Verified: a5 running families did not fade (build p95 4–6 ms in every 5 min). Commit `c55307b`.

**4.2 Catch-up pile-up (a4).** Fix: **single-flight catch-up per family, capped at 2 s** (`catchup_ms`), attempts keep using the cached tip meanwhile; timeouts logged to `catchup-<lane>.jsonl`. Verified: a5 bq ≤ 7, q ≤ 8, all lanes 1,800/1,800 s. Commit `c55307b`.

**4.3 Families froze on a phantom tip (a5).** Symptom: 3 of 4 families stopped for good, firing on a tip one hop ahead of the live chain → only orphans. Cause: TN10 virtual-chain reorgs un-accept the newest hop (`removedChainBlockHashes`, ~8/min); with contention the reverted hop can lose for good, and the a5 code could only move a tip forward. Fix: **tip step-back**: keep the last 8 states, `probeBack` N-1…N-8 after "no live minter" or 2 timeouts, `TIP_BACK` line, forced state write; coordinator logs `UNACCEPT` and probes back too. Verified: rehearsal with a planted bad tip recovered in 1.13 s; a6 3/3 phantom tips back in ~5.4 s, 0 freezes. Commit `394ad0c`.

**4.4 Desk share just under 15 % (a6: 14.973 %).** Cause: desk loses races to boson (network position); desk waited for the next 200 ms tick after a tip change. Fix (a7): **fire on new tip**: when a family's tip changes (own catch-up or newer shared state) the next attempt goes out at once and the following tick is dropped (rate unchanged); `tip_age_ms` + `fire` per attempt. Verified: 10-min rehearsal ([REHEARSAL-a7](logs/selftest-2026-10-30/step3-base/REHEARSAL-a7.md)): the desk fires first, but its share stayed 13.19 %; the race is won after submit by network position. Resolved by the criteria change in 5.2 (desk share reported only). Commit `f8e43ff`.

## 5. Scoring

**5.1 Share rounded before the check (a6).** Symptom: 14.973 % printed and passed as 15.0. Fix: `share_pass` on the unrounded share, `share_exact_pct` reported. Verified: a6 rescored FAIL. Commit `333b754`.

**5.2 Criteria changes and why** (all dated in [`plan/PLAN.md`](plan/PLAN.md)):
- *On every second / rejects* (after a2): attempts in every second, hops land ≥ 99 % of seconds, non-contention rejects ≤ 1 %; contention rejects (`already_spent`, `orphan`) are the point of the test, so "≥ 90 % accepted" was wrong.
- *Mini lane share* (after a3): mini (tunnel) scored on attempts + errors only; share reported.
- *Public-lane share* (after a4, stp option a): 15 % share rule on the desk lane only; muon/boson share depends on their distance to TN10 miners, which we don't control.
- *Desk-lane share* (dated change 30 Oct 18:06 CET, after the a7 rehearsal, plan 2b): no lane has a share rule; desk scored like the others (attempts every second, non-contention errors ≤ 1 %), all shares reported. Reason: network position decides the race, not code (rehearsal: desk 13 % of accepted submits land, boson 76 %). `score.mjs` default `SHARE_LANES` empty.
- *Node RPC* (after a5): p95 < 50 ms and max < 250 ms (one 97 ms spike should not decide a run).
- *Clock gate* (after a5): preflight fails at |offset| > 80 ms (`clock_gate: fail` once the clock is fixed).
- *Genesis-key funding* (after a5): see 2.2.
- *2-hour confirmation* (stp): after the first 10/10, the same setup for 2 h must also score 10/10 before scaling.

## 6. Desk host (Windows)

**6.1 pwsh 7 date parsing (a3).** Symptom: void `END` line at launch. Cause: pwsh 7 `ConvertFrom-Json` turns ISO strings into local `DateTime`. Fix: read the raw text with a regex or `ConvertFrom-Json -DateKind String`. Verified: a4+ START/END on time. Commit `a6bb233`/`3f567aa`.

**6.2 PowerShell 5 launches (a3, a6).** Symptom: orchestrator died silently (PS 5.1 turns node stderr into a stopping error). Fix: **launch only with pwsh 7**; `desk-a7.ps1` aborts with `LAUNCH_ABORT reason=pwsh` otherwise. Commit `394ad0c` (finding), a7 prep (check).

**6.3 Mini node 24 exit code.** Symptom: libuv assert at process exit after the wRPC disconnect → non-zero exit although preflight passed. Fix: orchestrator parses the preflight result lines instead of trusting the exit code. Commit `394ad0c`.

**6.4 Broker EPIPE at END (a5).** Fix: socket error handler. Commit `394ad0c`.

**6.5 Desk clock −88 → −162 ms (a1–a6).** Symptom: criterion 1 failed every run; offset grew. Cause: Windows synced rarely and only *slews* small offsets; it only steps the clock above `MaxAllowedPhaseOffset` (default 300 s), so −160 ms was never corrected quickly. The agent session is not admin. Fix (stp, admin pwsh 7, 30 Oct 17:45–17:47 CET):
```powershell
w32tm /config /manualpeerlist:"pool.ntp.org,0x8" /syncfromflags:manual /update
reg add HKLM\SYSTEM\CurrentControlSet\Services\W32Time\TimeProviders\NtpClient /v SpecialPollInterval /t REG_DWORD /d 900 /f
reg add HKLM\SYSTEM\CurrentControlSet\Services\W32Time\Config /v MaxAllowedPhaseOffset /t REG_DWORD /d 0 /f   # the key step: step the clock at once
Restart-Service w32time
w32tm /resync /force
w32tm /stripchart /computer:pool.ntp.org /samples:3 /dataonly
```
Verified: stripchart −0.162 s at 16:46Z (after the first three steps alone), **+0.0008 / +0.0004 / +0.0004 s at 16:47:50Z** after `MaxAllowedPhaseOffset 0`. a7 runs with `clock_gate: fail`.

## Launch checklist
1. Admin/clock: `w32tm /stripchart … /samples:3` within ±20 ms; config `clock_gate: fail`, `clock_max_ms: 80`.
2. Orchestrators started with **pwsh 7**, **detached** (`Start-Process`), never from an agent shell that can be cut off.
3. Never restart/stop/reconfigure kaspad. TN10 only.
4. Lane keys: ≥ 400 coins of 16 tKAS (preflight floor 200). Genesis keys: ≥ 1 coin ≥ 15 tKAS each (`preflight --genesis`).
5. Hosts: muon `.kaspa.blue`, boson **`.kaspa.red`**.
6. Fresh genesis, new launch paths per run; handoff pushed to the desk receiver, sha256 checked; guard refuses before the handoff (`GUARD_PRE` non-zero) and passes after it.
7. One builder per sender (`STORM_BUILDER_DIRECT=1`, own root), `catchup_ms: 2000`, step-back on, fire-on-tip on.
8. Scripts copied from the repo carry scrubbed default paths (`<desk-user>`): always pass `-Kit`, `-OldKit` and `-BuilderRoots` explicitly (a7 first desk launch had to be restarted at 17:08Z for this).
9. START at a round minute ≥ 10 min after ready; 20 min recovery after END; scoring by a separate routine after END.
10. After scoring: `recount.mjs` must print `RECOUNT_OK`; `score.mjs` uses `share_pass` (unrounded).
11. Commit scrubbed: no keys, addresses, IPs, txids, hostnames, covenant ids, private paths or tokens.
