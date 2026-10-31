> Kaspa Testnet-10 only. Internal self-test, no Pulse. Fall-back guide for future runs.

# RUNBOOK · every problem from a1 to a10 and how it was solved (a9 9/10, a10 7/10)

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

## 7. Box as sender host (b1, 30 Oct)
- **Box suspends when idle, so a box sender needs an active session.** Symptom: health gaps 156 s / 56 s, WebSockets dead, senders `SENDER_OFF`. Fix: an agent keeps foreground commands running (25 s loops checking senders + health) for the whole window; b1 held 19:24:30–19:50 with 0 freezes. Verified: a detached `nohup` keepalive (1 s ticks + HTTPS HEAD) alone still froze (19 s, 45 s gaps) — not a fix.
- **NTP is blocked on the box** (UDP 123); the HTTPS offset jumps ±0.9 s after suspends. Clock gate on the box = known failure; log it only.
- **Senders reconnect after `node_dead`** (b2, fixed): wRPC client is rebuilt on 3 failed probes. Verified 30 Oct 20:36Z: killed WebSocket → `RECONNECT_OK` 379 ms → `SENDER_ON`.
- b2 (21:00–21:20Z): full window, **0 freezes** (health max gap 5.03 s), 0 errors, every lane every second. The agent session ended early but the box did not suspend within the run.
- **When a session ends early, orchestrators keep running**: after the window, stop `b2-box.sh`, `health.sh` and the clock keeper on the box and the mini orchestrator, node-watch and post-end (never kaspad).
- **Coordinator resync skips hops in the hop log** (b2: ~57 per family after the mini node lost peers for 55 s). Score #10 against the recount, or back-fill the skipped seqs.

## 8. a8 (2-hour confirmation)
- **Hop log missed resync-skipped hops (a7: 220, b2: ~57/family).** Fix: `coordinator.mjs` (kit8) writes the skipped seqs as `source:"backfill"` lines and the resync tip as `source:"resync"`; every line has `seq`; `score.mjs` counts back-fill hops (`hops_backfill`), never as landing seconds. Verified: reh8b 2 resyncs → 12 back-fill + 2 resync lines.
- **`RECOUNT_OK` only checked rows.** Fix: `recount.mjs` compares hop log (unique family+seq) with the recount, `RECOUNT_MATCH` ≤ 0.5 % else `RECOUNT_DIFF`; `mini-a8.ps1` copies it to phase.log. Verified: reh8b `RECOUNT_MATCH` 1,833 vs 1,837 (0.218 %).
- **Desk reboot kills the desk end of the mini tunnel** (mini end keeps dialing). Fix: restart `rtunnel.mjs desk --leg-port 18698 --local 127.0.0.1:17299` detached, then probe the mini node through it before launch.
- **Lane keys can be spent by other runs** (boson key used by the box runs b1/b2: 3 usable coins left). Preflight caught it (`PREFLIGHT exit=20`, safe abort). Fix: top up all lane keys to 400 before every run; the public lanes timed out on large `getUtxosByAddresses` for the treasury once (muon), boson worked.
- **A desk orchestrator that aborts leaves receiver/watch/post-end running** (port 18600 stays taken). Stop those pids before the next launch.
- Mini runs Windows PowerShell 5: no `ConvertFrom-Json -DateKind` there (strings stay strings anyway).
- After a desk reboot the clock fix held (`MaxAllowedPhaseOffset` 0, stripchart +0.7…+1.0 ms): no re-fix needed.
- **Lane funding pool ran dry in the 2-hour run (a8).** Symptom: boson `pool-boson.csv` fell 400 → 0 (first 0 at 01:40:21Z), 39 seconds with no boson attempt (criteria 2 and 6 fail), throughput 5.2 → 4.4 hops/s. Cause: each landed hop uses ≈ 0.26 tKAS of lane funds (estimate) and a coin leaves the pool at ≤ 3 tKAS; boson wins ~57 % of races; the preflight checks coin **count** (≥ 200) only. Fix (open, for the rerun): size lane funds to the run (boson ≥ 800 × 16 tKAS, muon ≥ 600 × 16, ×3 for 3× rate), `POOL_LOW` phase line < 100 coins, preflight on usable value. Verify: rehearsal, then the 2-hour rerun.
- **Mempool background above the ≤ 5 recovery rule (a8).** Desk 52–56, mini 672–741 before, during and after a8 (since 23:06Z on 30 Oct; 2–10 in a3–b2), so criterion 9 fails although the run left nothing behind. Open: identify the entries read-only (ours vs foreign); rule change is stp's decision.

## 9. a9 (after a8 7/10)
- **Boson lane ran dry mid-run (a8, 01:40Z).** Cause: the lane that lands most hops pays most fees (boson ≈ 55 tKAS/min); 400 coins passed preflight by count but lasted ≈ 95 min. Fix: fund for the window (boson 800, others 600) and **preflight on usable value** (`usable_tkas` ≥ per-lane `usable_min_tkas` ≈ 2 h burn × 1.3), plus **`POOL_LOW`** alert under 100 coins.
- **Mempool background (a8 criterion 9).** Census: desk 52, mini ~700 entries, **none ours**, stuck for the whole run. Strict rule kept; baseline + 5 reported as an unofficial line until stp decides.
- **Treasury funding is slow** (~1.47 M mined coins, 40 s per full query, muon timed out). Use boson, query once, prepare 700-tKAS coins first, one per 40-output batch.

## 10. a9 scored (9/10, 31 Oct)
- **Window-sized funding verified.** a9 (03:25–05:25Z): no `POOL_LOW`, lowest pools desk 435 · mini 464 · muon 297 · boson 682 (start 600/600/600/800); criteria 2 and 6 pass for 2 h, 5.0–5.26 hops/s every 10 min. Muon is the lane to watch at higher rates (−300 coins in 2 h).
- **Bogus clock row (a9 desk 03:08:04Z, `offset_ms=-4002404878292.5`, n=1).** Cause: `clock-offset.mjs` accepted an NTP reply with zero timestamps (Kiss-o'-Death / stratum 0; the other 4 samples timed out). Not a clock step: the gate row 9 min later read +1.8 ms. Fix: replies with stratum 0 or a zero transmit time are dropped (`kod_or_zero_ts`). Verified: syntax check on the box only (UDP 123 is blocked there, see 7); deploy to the desk/mini kits and check one `clock-desk.csv` row before a10.
- **Public-lane WebSocket drop (boson 05:08:15Z, 1.6 s, 32 `rejected rpc` = 0.02 %).** Sender kept going, landed again within 2 s, no `SENDER_OFF`. No fix needed (within the 1 % rule); keep watching.
- **Criterion 9 still fails strictly** on the foreign backlog (desk 52, mini 676 before START; 55 / 679 at END). The run returns to baseline at 0 s (unofficial baseline + 5: PASS reached, short foreign spikes above it later in the 10 min, as before START). Open: rule decision (stp) — baseline + 5, or "0 of our txs in the mempool census at END + 10 min".
- **Genesis keys at 1 coin ≥ 15 tKAS each after a9.** Top up before a10 (preflight `--genesis` would still pass with 1, but a relaunch would not).

## 11. Criterion 9 = own-tx census (31 Oct, stp 07:36 CET) and a10
- **New rule:** 0 of our transactions (paying to lane or genesis keys) in the desk and mini mempools at END + 10 min. Tooling: `mempool-ro.mjs --extra <genesis addr file> --wait 0 --label <node> --log <run>/logs/mempool-ours.jsonl`; `--save-pre` before START stores the ids of our txs already stuck (private run dir), `--pre` reports `ours_new` without them. `desk-a10.ps1` runs it at END + 10 min for desk and mini (tunnel) and writes `CRIT9 node=… ours=… ours_new=…`. `score.mjs … <census.jsonl>` → `crit9.pass` (strict) and `crit9.pass_excl_pre_start`.
- **a9 under the new rule: unconfirmed.** a9 logged only mempool size at END + 10 min, no own-tx counts. Census at 06:38–06:41Z (73–76 min after the a9 END): **3 own tx on desk, 6 on mini, still there 30 s later** (2 in / 3 out, mass ≈ 200,000, fee 0.05 tKAS, not orphans, paying to lane keys 0/1/3). Nothing of ours was sent between END and then, so these are most likely a9 leftovers and a9 would likely **fail** the new criterion 9; they sit above the standard mass limit and are not mined. They cannot be cleared without restarting kaspad (not allowed); they stay until mempool expiry.
- **Consequence for a10:** these 9 are pre-START own txs. Strict scoring fails a10 on them. `ours_new` (own txs created in a10) is logged so stp can decide whether pre-existing stuck txs count. Root cause (which family/hop produces ≈ 200 k-mass txs) is open.
- **Funding scripts need `send`.** `fund-gen8.mjs` / `fund-lanes9.mjs` without `send` are a dry run (prints `outputs` only). a10 prep: genesis 4 coins each, lanes 600/600/600/800, after `send prep` then `send`.
- **Coin count ≠ usable value.** a10 first slot aborted at preflight: boson had 800 coins but only 4,705 usable tKAS (< 8,600). Fix used: boson target 1,120 coins. Next: fund to `usable_min_tkas`, not a coin count.
- `clock-offset.mjs` fix deployed (desk kit10, mini kit/kit8); check rows desk +4.6 ms, mini +23.7 ms (n=5).

## 12. a10 scored (7/10, 31 Oct) — stuck own txs, node stalls, score.mjs
- **Heavy (≈ 200 k mass) own txs = stuck race losers, not a heavy family.** Every hop of every family and lane has this shape (one path only: `sender.mjs` → `covenant.mjs buildHop` → builder `kcc20 storm hop`): 2 in (minter 10 tKAS covenant + 1 lane funding coin) → 3 out (minter 10 tKAS, KCC20 token **0.2 tKAS**, change), compute mass 9,123, **storage mass ≈ 200,000** (node; KIP-9 storage mass grows as the output value shrinks, the 0.2 tKAS token output dominates), fee 0.05 tKAS (builder fee ignores storage mass; ≈ 25 sompi/gram). So the mass is normal for our hops and is not why they stick. `mempool-diag.mjs` (read-only, no ids) on all 27 own txs at END + 10 min: none landed in the hop log; for each, another lane's hop for the same family and seq was accepted 0.17–2 s after the loser was submitted; the loser's minter input is spent by that winner, its **funding coin still unspent**. The node admitted the loser while the winning block arrived and then never evicted it; RPC-submitted txs are high-priority in the kaspad mempool and do not expire. They leave only when their funding coin is spent by a mined tx (mid-run the sender reuses the coin a few seconds later, which is why only the last minutes' losers remain at END).
- **Fix: `tools/storm/sweep-ours.mjs`** (TN10 only, counts only). For each of our txs in the desk and mini mempools it finds a live lane funding input and submits a 1-in/1-out self-transfer of that coin back to the same key with `submitTransactionReplacement` (fee 0.06 tKAS, ≈ 30 × the loser's fee rate). The replacement evicts the loser and is mined normally. `desk-a11.ps1` runs it 3 times after END (END + 75 s, + 3 min, + 6 min; `SWEEP` phase lines, `logs/sweep.jsonl`) before the END + 10 min census. Dry run without `--apply`.
- **Verified 31 Oct 10:24–10:25Z** on the real a10 leftovers: dry run desk 10 own (9 sweepable) / mini 17 (15); `--apply` 19 replaced, 0 failed (mini had already dropped to 12 when the desk replacements were mined); 20 s later desk 1 / mini 2 own, census `ours_new` desk 1 / mini 1, pre-START mini 1. The 3 left have **no live input**: both inputs are spent and the node still keeps them (seen for 1 a10 boson hop on both nodes and 1 a9 leftover). Nothing can replace those without a kaspad restart (not allowed); they sit in the pre-START baseline of a11. Risk for a11: a loser of this kind created during a11 would still fail criterion 9.
- **Not changed (scaling note):** at ≈ 200 k storage mass only 2 hops fit in a 500 k-mass block; a 1 tKAS token output would cut it to ≈ 40 k (SDK estimate) and a fee that counts storage mass would rank our hops better. The token value is a constant in the untracked builder (`kcc20-reference`, `TOKEN = 20_000_000`) and would cost more tKAS per hop; decide before the 3× rate step.
- **Mini node freeze (09:44:37–09:45:17Z, 40 s)** took 25 landing seconds (criterion 3: 98.85 %, ≈ 99.19 % without them). Cause: memory pressure on the mini (kaspad 14 GB private on a 12 GB box, commit 21/22 GB, ≈ 1 GB free, up since 23 Oct). Needs stp (kaspad restart / reboot / RAM). Possible code mitigation, not built: coordinator fail-over to the desk node or a post-END back-fill of the last minute.
- **Desk node RPC spike 1,785 ms (09:33:22Z, DAA still 5 s)** failed criterion 7. kaspad-internal, nothing to fix on our side; watch whether it repeats.
- **`score.mjs` bug (a10 commit 3e350ba):** `const W0 = …` had ended up inside the comment on line 3, so the script could not run. Fixed (own line). Verified: a10 scored with it.
- **Funding to usable value:** lane top-up now counts usable tKAS (Σ (coin − 3 tKAS)) to `usable_min_tkas` × 1.15 and ≥ 450 coins (a10 used ≈ 6,500 usable tKAS on boson in 2 h). a11 prep ≈ 10:25–10:33Z: desk 518 coins / 4,610 usable, mini 594 / 6,440, muon 546 / 5,638, boson 972 / 9,890 (fees 0.29 tKAS); genesis keys 4 coins ≥ 15 tKAS each.

## 13. a10 fixes (31 Oct, stp 12:07 CET "Fix it. Full authority") and a11 relaunch
- **stp override, this fix only:** restart the **mini** kaspad (not the desk). The mini stays in the test (stp).
- **a11 first slot aborted** at 11:08–11:09Z, before its genesis (11:10Z): mini coordinator/broker/post-end and desk receiver/watch/post-end/launcher stopped; logs kept as `step3-a11-abort1` on both machines. No hop was sent.
- **Mini kaspad restart 11:09:48–11:10:12Z.** Graceful: Ctrl+C sent to its console (`AttachConsole` + `GenerateConsoleCtrlEvent`), log `Kaspad has stopped...` after 16 s; restarted from its own start script with the same TN10 args and data dir, only `--ram-scale` 0.6 → **0.4** (supported option, `--help` checked; script backup kept). Synced again at once: 11:21Z `synced=1`, DAA mini vs desk within 21 blocks over a 2 s read gap (≈ same tip).
- **Memory, mini (12 GB):** before kaspad private **13.91 GB** (working set 4.92 GB), free RAM 1.55–1.77 GB, free commit 1.40 GB. After: 11:20Z private 1.82 GB / free RAM 5.45 GB / free commit 8.94 GB; 11:45Z private 2.68 GB; 11:58Z 2.84 GB. Watch the growth during a11.
- **Pagefile:** system-managed, 10.6 GB allocated, peak use 2.4 GB. Not changed: the agent session on the mini is not elevated.
- **Side effect:** the restart emptied the mini mempool, including our stuck leftovers. Pre-START census 11:22Z: desk 82 entries / 1 ours, mini 82 / **0 ours**.
- **Token output 0.2 → 1 tKAS.** `kcc20-reference/src/bin/kcc20/storm.rs` `TOKEN = 100_000_000` (was 20_000_000), rebuilt on the desk; the same binary replaces the mini builder (`kcc20-root`, backups `.bak-a11`; the old mini binary was byte-identical to the old desk build). The builder is untracked and stays out of git.
- **Mass:** `tools/storm/mass-estimate.mjs` (SDK, offline) gives storage mass **50,096 → 10,130** for the hop shape (−80 %). The node reported ≈ 200 k for the old hop, so ≈ 40 k was expected; **confirmed live 12:01Z: 40,408–41,209** on the desk node (compute 9,123).
- **Cost:** each hop now locks 1 tKAS in the token output instead of 0.2: ≈ 5 × tKAS per hop (≈ 38 k tKAS for 2 h at 5 hops/s). Lanes topped up by usable value (`usable_min_tkas` desk 7,000 / mini 5,000 / muon 7,000 / boson 24,000, × 1.15, coins of 16 tKAS; 46 txs, fees 0.82 tKAS): preflight 11:50Z desk 783 coins / 8,055 usable, mini 594 / 6,440, muon 732 / 8,056, boson 2,335 / 27,609. Each coin still covers ≈ 12 hops before it drops under 3 tKAS.
- **a11 relaunch:** tag s3a11b, genesis 11:49:55–11:49:58Z (4 families), handoff ok, preflight all pass (clock −0.5 ms), START **12:00Z (13:00 CET)**, END **14:00Z (15:00 CET)**, census 14:10Z.

## 14. a11 scored (9/10, 31 Oct) and a12 prep
- **a10 fixes verified:** mini kaspad restart with `--ram-scale 0.4` (no freeze over 2 h, working set 2.6–3.6 GB, private 4.1 GB 45 min after END); 1 tKAS token output (live mass ≈ 41 k, 5.41 hops/s); RBF sweep (END+75 s: desk 7 + mini 6 replaced, 0 failed; census 0 new own tx); no desk RPC spike (max 17 ms).
- **Criterion 3 floor:** 98.92 % with no node stall. 60 of 65 gaps are single seconds; the second after a gap carries 6.06 hops vs 5.21 average, so the hops were ready but no accepting chain block took them in that second. Not fixable in our code at 4 families; the rule (99 %) is unchanged and left to stp.
- **Lane burn with the 1 tKAS token:** usable tKAS used in 2 h: boson ≈ 24,600, muon ≈ 7,550, mini ≈ 5,600, desk ≈ 1,770. muon hit 8 coins at 13:59:39Z (18 `POOL_LOW`), mini 72. a12: `usable_min_tkas` mini 5,000 → 9,000, muon 7,000 → 11,000, boson 24,000 → 32,000 (funded to × 1.15, `fund-lanes12.mjs`, 4,403 coins of 16 tKAS).
- Mini zip from `Compress-Archive` on Windows PowerShell 5 stores backslash paths; rename after `unzip` on the box.

## 15. a12 scored (5/10, 31 Oct): home-network outages
- **Symptom:** all 4 senders `SENDER_OFF reason=node_dead` 3 times (16:14, 16:16, 16:29Z), both nodes 0 peers and `synced=0`, DAA flat, public lanes time out (sender RPC ≈ 8 s).
- **Cause:** local network. Desk NIC (Intel I226-V, driver 2.1.5.7) logs `e2fnexpress` 27 (link down) / 32 (link up), and the mini logs NCSI 4042 "Capability: None" in the same second. TN10 kept going (DAA caught up at ≈ 10/s). Same drops on 29 and 30 Oct (15 total).
- **How to check (read-only):** `Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='e2fnexpress';StartTime=...}` on the desk and `Microsoft-Windows-NCSI/Operational` on the mini for the run window. Put the result in the attempt as `lan-events-*.csv`.
- **Fix:** not in our code. stp to check the shared network (router/switch/cable). Desk I226-V cards are often reported with link drops; common remedies (driver/firmware update, Energy-Efficient Ethernet off) need stp's OK since they touch his network settings. Until then, the senders' pause/resume/back-fill keeps the run going and the recount honest.
- **Criterion 3 without the outages:** 98.66 % (a11 98.92 %). The floor stands; stp's decision.
- **Criterion 9:** one new own tx on the mini with no live input after the outages; cannot be swept.
- Desk also logged one `Tcpip 4266` (UDP ephemeral ports all in use) at 16:38:28Z (one a day on 29, 30, 31 Oct); 61 UDP endpoints at 18:30Z, so not a leak by our senders. Watch only.

## Launch checklist
1. Admin/clock: `w32tm /stripchart … /samples:3` within ±20 ms; config `clock_gate: fail`, `clock_max_ms: 80`.
2. Orchestrators started with **pwsh 7**, **detached** (`Start-Process`), never from an agent shell that can be cut off.
3. Never restart/stop/reconfigure kaspad. TN10 only.
4. Lane keys: fund for the whole window (a9: boson 800, others 600 coins of 16 tKAS); preflight checks count and usable value (`usable_min_tkas`). Genesis keys: ≥ 1 coin ≥ 15 tKAS each (`preflight --genesis`).
5. Hosts: muon `.kaspa.blue`, boson **`.kaspa.red`**.
6. Fresh genesis, new launch paths per run; handoff pushed to the desk receiver, sha256 checked; guard refuses before the handoff (`GUARD_PRE` non-zero) and passes after it.
7. One builder per sender (`STORM_BUILDER_DIRECT=1`, own root), `catchup_ms: 2000`, step-back on, fire-on-tip on.
8. Scripts copied from the repo carry scrubbed default paths (`<desk-user>`): always pass `-Kit`, `-OldKit` and `-BuilderRoots` explicitly (a7 first desk launch had to be restarted at 17:08Z for this).
9. START at a round minute ≥ 10 min after ready; 20 min recovery after END; scoring by a separate routine after END.
10. After scoring: `recount.mjs` must print `RECOUNT_OK` **and `RECOUNT_MATCH`** (kit8); `score.mjs` uses `share_pass` (unrounded).
12. Lane funds for the run length: expected landed hops per lane × ≈ 0.3 tKAS (boson wins most races); check every `pool-*.csv` stays well above 100 during the run (a8: boson ran dry after 95 min).
13. Note both nodes' mempool before launch; criterion 9 needs ≤ 5 (a8 baseline was 52 / 673, a9 52 / 676).
14. Deploy the current `clock-offset.mjs` (drops zero-timestamp NTP replies) and top up the genesis keys (≥ 3 coins ≥ 15 tKAS each).
11. Commit scrubbed: no keys, addresses, IPs, txids, hostnames, covenant ids, private paths or tokens.
15. Pre-START census with `mempool-ro.mjs --save-pre` on desk and mini (a11: desk 1 / mini 2 own leftovers); the desk orchestrator must run the RBF sweep after END (`desk-a11.ps1`, `SWEEP` lines) before the END + 10 min census.
17. Size lane funding from the last run's usable-tKAS burn × 1.3 (RUNBOOK 14), not the run before.
18. Check both machines' network-card / NCSI events for the last hours before launch (RUNBOOK 15); if the desk link dropped, tell stp before starting.
16. Check the mini's free memory before launch (a10: ≈ 1 GB free, kaspad 14 GB private) and tell stp if it is that low.
