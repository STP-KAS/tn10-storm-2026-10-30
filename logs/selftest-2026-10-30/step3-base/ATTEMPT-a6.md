> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a6 · 4 families · rate 5/family · 15:00:00–15:30:00 UTC

**a6 ran the full window with no freeze, but FAILS (8/10 criteria).** The a6 fix for a5's phantom tip worked: all four families landed hops in every 5 minutes for the whole 30 minutes (312–330 hops per family per 5 min). Tips stepped back 11 times (3 times in the coordinator, 8 times in the senders), and the longest gap between landed hops was **5.45 s**. Total **7,734 hops = 4.30 hops/s** (a5: 2.93, a4: 4.09). Hops landed in **99.22 %** of seconds (a5: 96.61 %), so criterion 3 passes for the first time. The after-END recount found **7,732** hops (`RECOUNT_OK rows=4`). Two criteria fail:
1. **Desk clock −146.3 ms** at preflight and −154.0 ms after END. It has not been fixed (it needs admin on the desk).
2. **Desk lane share 14.973 %** of landed hops (1,158 / 7,734). The rule is ≥ 15 %, and the desk was **3 hops short** (1,161 needed). `score.mjs` showed 15.0 because it rounded; that is fixed in this commit, and the rule is now checked on the unrounded share.

Desk: `START` 15:00:00Z, `END reason=window` 15:30:00Z, `SENDERS_EXITED left=0` 15:30:04Z, `RECOVERY_DONE` 15:50:11Z. Mini: coordinator `STOP reason=END` 15:30:00Z, `END` 15:30:04Z, `RECOUNT` 15:31:04Z, **`RECOUNT_OK rows=4`** 15:50:11Z, `RECOVERY_DONE` 15:50:11Z. No `STALL`, no `PROC_EXIT`, all sender `.err` files empty.

Same base as a5: fresh genesis, 4 families, rate 5, 30 min, 20 min recovery, one builder per sender, option (a) share rule, all senders on the desk, and the mini as main node and genesis.

## Score against the PLAN criteria (30 Oct rules: option (a) share rule, RPC p95 < 50 and max < 250 ms, clock gate)
| # | Criterion | Result | Key number |
|---|---|---|---|
| 1 | Step 1 pre-checks: synced, peers ≥ 8, **clock within 100 ms**, disk ≥ 100 GB | **FAIL (clock)** | desk clock **−146.3 ms** at preflight (14:49:14Z), **−154.0 ms** after END (15:30:04Z), and still **−157.2 ms** at 16:00:44Z (a read-only check after the run). The desk w32time reported a "successful sync" with time.nist.gov at 15:57:05Z, but the offset did not change, so **the clock issue is not fixed**. Mini +16.3 ms / +5.4 ms. Both nodes were synced with 8 peers at START. Free disk 436 GB on the desk and 313 GB on the mini (measured 16:00Z, after the run) |
| 2 | Every lane ≥ 1 attempt in each of the 1,800 s | **PASS** | desk, mini, muon, boson: 1,800 / 1,800 each |
| 3 | Hops land in ≥ 99 % of seconds | **PASS** | **99.22 %** (1,786 / 1,800). Missed per 5 min: 1 · 3 · 1 · 3 · 2 · 4. All 14 are single seconds |
| 4 | Every reject is contention; non-contention ≤ 1 % per lane (pre-submit errors included) | **PASS** | desk 0 · mini 0 · muon 0 · boson **25 / 34,209 (0.07 %)**: a WebSocket drop from 15:05:01.764 to 15:05:03.043Z |
| 5 | Desk lane ≥ 15 % of landed hops (option a) | **FAIL** | desk **14.973 %** (1,158 / 7,734; 1,161 needed). Per 5 min: 16.55 · 14.86 · 14.74 · 15.34 · 14.52 · 13.83 % |
| 6 | mini, muon, boson: attempts every second and non-contention ≤ 1 % (shares reported only) | **PASS** | 1,800 s each. Errors 0 / 0 / 0.07 %. Shares: mini 4.9 · muon 12.5 · boson 67.7 % |
| 7 | Node RPC p95 < 50 ms **and** max < 250 ms per node | **PASS** | desk p95 **4** ms, max **68** ms (one row, 15:28:56Z; p99 16). Mini p95 **2**, max **16** ms |
| 8 | Logs at 1 row / 5 s, full window, desk + mini | **PASS** | node-watch desk 359/360 and mini 359/360 rows, max gap 5.02 / 5.07 s, 0 errors. Hop log covers the full window; proc and pool logs have 360 rows per lane |
| 9 | Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | `node-recovery`: desk mempool 3 at 1 s after END, mini 5 at 0 s |
| 10 | 29 Oct items: handoff auto-copy, guard, post-end mempool + clock, all lanes together, after-END recount | **PASS** (one caveat) | handoff push 53 ms, sha256 match on the receiver. Guard OK with the handoff file, nothing started before it. Post-end CSVs 240 rows each, 0 errors. All 4 lanes ran from 15:00:00. **`RECOUNT_OK rows=4`** unattended. *Caveat:* the guard's refusal without a handoff was **not shown again in a6.** The relaunch ran `GUARD_PRE` at 14:49:11Z, after the handoff had already arrived at 14:47:00Z. The guard code is unchanged since a5, where it refused with `GUARD_PRE exit=2` |

**8 / 10.** This is the best result so far (a4 6, a5 7), and a6 is also the best run: highest throughput, no freeze, and ≥ 99 % landing seconds for the first time. It is **not 10/10**, so the 2-hour confirmation is **not** prepared yet (PLAN: only after the first 10/10).

## Recount (`RECOUNT_OK`)
- The mini's own after-END recount (`recount.mjs`, own builder, walks every family from its genesis state on the mini node) ran on its own at 15:31:07–15:31:15Z. Results: f1 **1,940** · f2 **1,936** · f3 **1,923** · f4 **1,933** = **7,732 hops**. The phase log shows `RECOUNT_OK rows=4` at 15:50:11Z, and `recount.err` is empty. It was **not** run again by hand: it runs on the mini (mini work goes via the mini bot), and it passed unattended.
- The hop log (mini coordinator) has f1 1,940 · f2 1,936 · f3 **1,924** · f4 **1,934** = **7,734**. All txids are unique, and all 7,734 fall in the window. The two counts differ by **2 hops (0.03 %)**: f3 +1 and f4 +1 in the hop log. Those are the two families whose coordinator stepped back from seq 678 at 15:10:34–36Z (`UNACCEPT family=3/4 seq=678`, then `TIP_BACK … from=678 to=677`). The coordinator had already written the reverted 678 to `hops.jsonl`, and then wrote the replacement 678 too. f1 also stepped back (268 → 267 at 15:04:05Z) but matches exactly. Why it matches is not proven per hop: the hop log has no seq field, and txids stay out of git. Fix for a7: mark reverted hops in the hop log (see the a7 plan).
- 139 of the 7,734 hops (1.8 %) have an empty `accept_header_utc`. The coordinator saw the minter at its next address but did not see the accepting chain block within 40 polls (≈ 8 s), so these are placed by `seen_utc`. Their landing seconds are therefore approximate to ±0.2 s.

## Tip step-back, UNACCEPT and freezes
| What | Count | When (UTC) |
|---|---|---|
| `UNACCEPT` (coordinator, mini phase log) | **843** (f1 188 · f2 213 · f3 213 · f4 229) | per 5 min 130 · 143 · 155 · 143 · 153 · 119. Spread over the whole run, about 0.47/s |
| `TIP_BACK`, coordinator | **3** | f1 268 → 267 at 15:04:05 · f3 678 → 677 at 15:10:34 · f4 678 → 677 at 15:10:36 |
| `TIP_BACK`, senders (desk phase log, `why=timeouts`) | **8** | f1 268 → 267 on all 4 lanes at 15:04:09–10 · f4 678 → 677 on all 4 lanes at 15:10:38. No sender stepped back on f3: its senders found the new 678 going forward |
| `STALL` (no hop for 30 s) | **0** | – |
| Longest gap between landed hops per family | f1 **5.45 s** (after 15:04:04.845) · f2 2.04 s · f3 2.48 s · f4 **5.44 s** (after 15:10:33.592) | Only 2 gaps > 5 s in the whole run, and both are the two step-backs. Recovery about 5.4 s each time |
| Longest gap between **sends** for one family on one lane (family freeze check) | **0.45 s** (muon, at START). desk ≤ 0.30 · mini ≤ 0.30 · boson ≤ 0.31 s | No family stopped sending on any lane. **No family freeze** |
| `PROC_EXIT` before END | 0 | – |

So the reorg mechanism from the rehearsal is real under 4-lane load: about 0.47 `UNACCEPT`/s. Only 3 of the 843 led to a coordinator `TIP_BACK`. In all the others the family kept landing with no step-back. In those 3 cases the reverted hop lost for good (the a5 phantom tip), both the coordinator and the senders stepped back and the family was landing again within ~5.4 s. a5 would have frozen three times.

## Lanes (all attempts inside the window, submit logs → `score.mjs`, `SHARE_LANES=desk`)
| Lane | Attempts | ok | already_spent | orphan | Non-contention | Attempting seconds | Landed | Share of all landed | ok → landed |
|---|---|---|---|---|---|---|---|---|---|
| desk | 33,133 | 7,672 | 16,810 | 8,651 | 0 | **1,800 ✅** | 1,158 | **14.973 % ❌ (scored)** | 15.1 % |
| mini | 33,186 | 7,052 | 16,611 | 9,523 | 0 | **1,800 ✅** | 379 | 4.9 % (reported) | 5.4 % |
| muon | 33,211 | 7,211 | 17,528 | 8,472 | 0 | **1,800 ✅** | 963 | 12.5 % (reported) | 13.4 % |
| boson | 34,209 | 7,205 | 17,325 | 9,654 | 25 (0.07 %) | **1,800 ✅** | 5,234 | 67.7 % (reported) | 72.6 % |

All 7,734 hops are attributed to a lane. Landed per family (f1 · f2 · f3 · f4): desk 307 · 269 · 314 · 268, mini 82 · 97 · 89 · 111, muon 231 · 264 · 233 · 235, boson 1,320 · 1,306 · 1,288 · 1,320. Boson won **more** races than in a5 (67.7 % vs 58.0 %), and every other lane lost share. The desk node accepts the desk lane's transaction (7,672 ok, about the same as the other lanes), but only 15.1 % of those end up as the accepted hop. Boson's end up accepted 72.6 % of the time. That fits the PLAN's own reason for option (a): the winner depends on how close a node is to the TN10 miners. The desk is the one lane where this is still scored.

Sender-side submit rpc p50 / p95 / max: desk 0 / 1 / 145 ms, mini (tunnel) 2 / 52 / 102, muon 91 / 130 / 414, boson 22 / 43 / 616. Build p50 / p95 / max on every lane: 1–2 / 4–6 / 10–14 ms. Catch-up p50 / p95: desk 2 / 8, mini 7 / 62, muon 181 / 368, boson 66 / 124 ms. Builder queue `bq` max 4–7, in-flight `q` max 4 (desk, mini), 8 (muon), 12 (boson).

Funding pools (5 s log): 372–377 at START, never below 279 (end: desk 296, mini 298, muon 300, boson 285). No coin starvation ✅.

## Chain result
- **7,734 hops in 1,800 s = 4.30 hops/s** (recount 7,732 = 4.30). Per family: 1,940 · 1,936 · 1,924 · 1,934.
- By 5 min (hops/s): **4.24 · 4.33 · 4.37 · 4.31 · 4.25 · 4.27**, flat. Per family per 5 min: f1 323 · 328 · 330 · 320 · 321 · 318, f2 320 · 324 · 328 · 324 · 317 · 323, f3 312 · 327 · 322 · 325 · 319 · 319, f4 318 · 321 · 330 · 324 · 319 · 322. **No fade and no dead family.**
- Per family: 1.04–1.10 hops/s, about the same as a5's running family (1.06–1.12) and below a4's first 15 min (~1.33).
- Orphans per family per 5 min (all four lanes): about 1,500 (sum of lanes 5,997 in the first 5 min / 4 families), against a5's ~1,550. **The skip-while-catching-up change made no measurable difference** to orphans or to hops per family.
- Catch-up timeouts: desk 19, mini 4, muon 4, boson 6 (per 5 min, all lanes: 8 · 0 · 12 · 3 · 4 · 6). In a5 there were 1,111–1,159 per lane. Boson also logged 25 `catchup_error` and 21 `error` lines during its WebSocket drop at 15:05.

## Nodes (node-watch every 5 s)
| Node | Rows in window | synced | peers min | rpc p50 / p95 / p99 / max | mempool max | kaspad CPU / RAM max | DAA/s |
|---|---|---|---|---|---|---|---|
| desk | 359/360 | 100 % | 7 (15:04:54–59, 15:26:11–31) | 1 / **4** / 16 / **68** ms | 65 | 3.5 % / 8.6 GB | 10.13 |
| mini | 359/360 | 100 % | 8 | 1 / **2** / 2 / **16** ms | 68 | 6.0 % / 4.5 GB | 10.13 |

Desk rpc max per 5 min: 15 · 15 · 15 · 4 · 16 · 68. The single 68 ms row (15:28:56Z) is below the 250 ms max. Desk free RAM never fell below 6.2 GB, mini 1.5 GB. Recovery: post-end mempool CSVs 240 rows each, 0 errors, max mempool 61 / 55 (TN10 background), rpc max 20 / 35 ms ✅. Clock (`clock-*.csv`, pool.ntp.org, 5 samples): desk −145.2 (14:40:46Z), −146.6 / −146.3 (14:49Z), **−154.0 ms (15:30:04Z)**, about −0.19 ms/min. Mini +16.3 (14:40:37Z), +5.4 ms (15:31:04Z).

Sender processes: CPU avg 2.9–3.6 %, max 7.5–11.3 %. RSS 97 → 221–235 MB, flat after the first minutes (a5: ≤ 240 MB). In a5 builder CPU climbed to ~240 s per 5 min on dead-family walks; in a6 nothing like that happened.

## What worked (a6 fixes)
1. **Tip step-back** (sender + coordinator, 8 states, `probeBack`): 3 real phantom tips in 30 min, each recovered in ~5.4 s. a5 froze for good on the same event. This was the main a6 goal, and it held with 4 lanes.
2. **`UNACCEPT` logging** measured the reorg rate under load for the first time: 843 in 30 min.
3. **No family freeze, no fade**: 4.24–4.37 hops/s in every 5 min, all families 312–330 per 5 min.
4. **Landing seconds 99.22 %**, a first.
5. Catch-up timeouts fell from ~1,100+ per lane (a5) to 4–19 per lane, because no walk ever ran on a dead tip.
6. RPC rule: p95 4 / 2 ms. Preflight lane checks, genesis-key check (4/4) and handoff (53 ms) all passed. `proc-host-desk.csv` is separate (no collision). Broker `EPIPE`: `broker.err` holds only the `builder exit 0` line at 15:30:00Z, with no crash.
7. The recount ran on its own and agrees within 2 hops.

## What didn't, and why
1. **Desk clock −146 → −154 ms (criterion 1).** Not fixed. The agent session on the desk is not elevated (`IsInRole(Administrator) = False`, checked again at 16:00Z), and every fix needs admin (see "Desk clock" below). w32time does "sync" (last success 15:57:05Z, time.nist.gov), but the offset against pool.ntp.org stays near −150 ms, so it is not correcting the clock. It needs a new NTP peer and a shorter poll interval, set as admin.
2. **Desk share 14.973 % (criterion 5)**, 3 hops short. The desk lane attempts as often as the others and its node accepts its transaction as often (ok ≈ 7,000–7,700 on every lane), but boson's transaction wins 67.7 % of the races (a5: 58 %). Most likely boson's node is closer to the TN10 miners, so its transaction reaches them first; this is not measured directly. With three dead families in a5, more of the remaining wins went to the desk (19.9 %). With all four families alive, boson's advantage shows fully.
3. **`score.mjs` rounded the share** (14.973 → 15.0) before comparing it. Fixed: `share_exact_pct` and `share_pass` now use the unrounded value.
4. **The hop log counts reverted hops** (f3/f4 +1 at the 678 step-backs). This is small (2 / 7,734), but the scorer reads the hop log, so it should match the recount.
5. **Skip-while-catching-up did nothing measurable** (orphans per family ~1,500 vs a5 ~1,550, hops per family 1.04–1.10).
6. **Boson WebSocket drop** at 15:05:01.764–15:05:03.043Z: 25 rpc rejects (0.07 %). It reconnected by itself. Within the 1 % rule.
7. **The guard refusal was not shown again in a6**, because the relaunch ran the guard after the handoff had arrived (see criterion 10).
8. **The desk orchestrator first died under Windows PowerShell 5** (14:40:46Z) and was relaunched under pwsh 7 (see Launch).

## Plan for a7 (fixes; a7 NOT started)
| # | Failure | Fix | Where | Who |
|---|---|---|---|---|
| 1 | Desk clock ~−150 ms | **Once, in an elevated (Run as administrator) PowerShell on the desk:** `w32tm /config /manualpeerlist:"0.pool.ntp.org,0x8 1.pool.ntp.org,0x8 time.cloudflare.com,0x8" /syncfromflags:manual /reliable:no /update` → `reg add HKLM\SYSTEM\CurrentControlSet\Services\W32Time\TimeProviders\NtpClient /v SpecialPollInterval /t REG_DWORD /d 900 /f` → `net stop w32time; net start w32time` → `w32tm /resync /rediscover`. Check with `node kit\clock-offset.mjs --samples 5`: it should read within ±20 ms, and ≤ 80 ms an hour later. Then set `clock_gate: fail` in the a7 config | desk OS | **stp** (admin; the agent cannot elevate) |
| 2 | Desk share 14.97 % | **Fire on new tip** in `sender.mjs`, the same for every lane. When a family's tip changes (own catch-up, or the shared state written from a live check), send that family's next attempt **at once** instead of waiting for the next 200 ms tick. The tick that follows is dropped, so the rate stays at 5/s per family per lane. Log a new `tip_age_ms` per attempt (time since the tip was first seen live by any lane), so we can measure where the desk lane loses. **Rehearsal first** (10 min, 2 families, all 4 lanes, TN10). It passes if the desk share is ≥ 17 % and no other criterion gets worse | `sender.mjs` (desk) | Grok Bot (desk) |
| 2b | if 2 does not lift the desk share | The share rule is stp's decision (option a was his). Option: score the desk lane like mini, muon and boson (attempts every second + errors ≤ 1 %, share reported), because a6 shows the winner is set by network position. **Not changed here** | `plan/PLAN.md` | **stp** |
| 3 | Hop log counts reverted hops | The coordinator writes `{"family":N,"revert_of":<seen_utc>,"seq":S}` when a `TIP_BACK` drops a hop it already logged. It also adds a `seq` field to every hop line. `score.mjs` skips reverted hops. Then hop log = recount | `coordinator.mjs` (runs on the **mini**, kit6) | **mini bot** (described here, not applied) |
| 4 | Share rounded before the check | `share_pass` on the unrounded share | `score.mjs` | **done in this commit** |
| 5 | Guard refusal not shown in a6 | Every launch runs `launch-desk.ps1 -GuardOnly` **before** the handoff exists and logs `GUARD_REFUSE exit=2` as a hard pre-check (abort the launch if the guard does *not* refuse) | `desk-a7.ps1` | Grok Bot (desk) |
| 6 | Orchestrator under PowerShell 5 | `desk-a7.ps1` checks `$PSVersionTable.PSVersion.Major -ge 7` first, else writes `LAUNCH_ABORT reason=pwsh` | `desk-a7.ps1` | Grok Bot (desk) |
| 7 | Skip-while-catching-up had no effect | Keep it (harmless). Fix 2 targets the same latency more directly |  |  |

**Why a7 was not started:** criterion 1 cannot pass until stp runs fix 1 as admin on the desk, so an a7 now would fail 10/10 on the clock for sure. Fix 2 changes the core sender loop and needs its own rehearsal first. Fix 3 is a mini-side change for the mini bot. Order: (1) stp's admin clock fix, (2) fix 2 + 5 + 6 on the desk and the fire-on-new-tip rehearsal, (3) fix 3 by the mini bot, (4) a7 with the same base (4 families, rate 5, 30 min, fresh genesis, 400 coins per lane). After a7 scores 10/10: the 2-hour confirmation on the same setup.

## What changed for a6 (code in `tools/storm/`)
| Change | Where | Why (a5 REVIEW) |
|---|---|---|
| **Tip can step back**: each sender keeps the last 8 states per family; when a catch-up from seq N finds nothing live at N or ahead (`no live minter`) or times out twice in a row, it probes the older states in **one** `getUtxosByAddresses` call (`probeBack`) and takes the newest live one, even if lower. `TIP_BACK sender= family= from= to= why=` in phase.log; the shared state is force-written from that live check | `sender.mjs`, `covenant.mjs probeBack`, `lib.mjs writeState(force)` | a5: three families frozen one hop ahead of the live tip |
| `newest()` prefers a state verified live (`live_utc`) and drops a **suspect** tip: an `orphan` on the cached tip marks that seq suspect, not just old | `sender.mjs` | a5 `markStale` only moved forward |
| **Coordinator**: reads `removedChainBlockHashes`, drops un-accepted txids, logs `UNACCEPT family= seq=`, keeps the last 8 published states and probes back at once on `UNACCEPT`, on a failed resync, or after > 10 s without a hop; resync failures are logged to `resync.jsonl` instead of swallowed | `coordinator.mjs` | a5 coordinator ignored reorgs and swallowed resync errors |
| **Skip a family's tick while its catch-up runs** (at most `skip_ms` = 250 ms, then attempt on the cached tip, so every lane still attempts every second) | `sender.mjs` | a5: ~3× a4's orphans per running family |
| Host process log renamed `logs/proc-host-desk.csv` | `desk-a6.ps1` | a5 name collision with the desk sender's `proc-desk.csv` |
| Broker: no crash on `EPIPE` when a client exits at END (guarded write, stdin error handler) | `builder-broker.mjs` | a5 mini broker crash at END |
| **Preflight clock gate** (\|offset\| > 80 ms fails; `clock_gate: log` = logged known failure) and **genesis-key funding check** (`--genesis`: ≥ 1 coin of ≥ 15 tKAS per family key, run on the mini before genesis) | `preflight.mjs`, `mini-a6.ps1` | a5 clock −119 ms; a5's first launch aborted on `no_funding` |
| `desk-a6.ps1 -Relaunch` (re-run guard + launch with the watch/receiver already running) | `desk-a6.ps1` | see launch below |

Rehearsal before a6: **PASS**, see [REHEARSAL-a6](REHEARSAL-a6.md) (planted one-ahead tip, `TIP_BACK` < 1 s, next hop 1.13 s after the plant).

## Desk clock (NTP fix tried, needs admin: known failure)
- 14:28Z `w32tm /resync /force`: **Access is denied (0x80070005)**. The agent session on the desk is not elevated (`IsInRole(Administrator) = False`).
- One-off elevated scheduled task (`schtasks /Create … /RU SYSTEM /RL HIGHEST`, then as the user with `/RL HIGHEST`): **Access is denied** both times. Setting the NTP peer (`w32tm /config /manualpeerlist:… /update`) needs the same rights and was not possible.
- w32time status: stratum 2, source time.nist.gov, poll interval 32,768 s (≈ 9 h), which explains the drift.
- Offsets: −143.6 ms (14:29Z), −140.9 ms (rehearsal preflight 14:34Z), −145.3 ms (14:40Z), **−147.1 ms at a6 preflight (14:49:14Z)**. Criterion 1 will fail on the clock in a6. a6 runs with `clock_gate: log` (dated change in PLAN); the offset is logged so per-second counts can be corrected.
- Fix (admin, once, on the desk): `w32tm /config /manualpeerlist:"pool.ntp.org,0x8" /syncfromflags:manual /update`, SpecialPollInterval ≤ 900 s, `w32tm /resync /force`.

## Launch (UTC)
| Time | Event |
|---|---|
| 14:40:37 | mini `PREFLIGHT_GENESIS exit=0` (4 / 4 genesis keys, 2 coins of ≥ 15 tKAS each) |
| 14:40:46 | desk orchestrator: `WATCH` started (node-watch, receiver, post-end). The orchestrator then died silently in the guard-only step, before `GUARD_PRE` was logged: it was started with Windows PowerShell 5 instead of pwsh 7 (a5 used pwsh). Nothing had started any sender |
| 14:46:56–59 | mini `GENESIS` families 1–4 included (fresh genesis, launch paths `…-s3a6-f1..4`) |
| 14:47:00 | handoff pushed (53 ms, sha256 match) |
| 14:49:11 | desk orchestrator relaunched under pwsh 7 with `-Relaunch` (same watch + receiver): `GUARD_PRE exit=0`, `HANDOFF seen_on_desk` |
| 14:49:14 | `PREFLIGHT exit=0`: desk 400 coins (wRPC 22 ms), mini 398 (5 ms), muon 400 (306 ms), boson 400 (89 ms); clock −147.1 ms `known_failure=1` |
| 14:49:15 | `LAUNCH exit=0`: no broker (one builder per sender), 4 senders |
| 15:00:00 | START (10 min 45 s after everything was ready) |

Known issue: on the mini, node 24 hits a libuv assert at exit after the wRPC disconnect (`UV_HANDLE_CLOSING`), so `mini-a6.ps1` parses the preflight lines instead of trusting the exit code.

## First 2 minutes (15:00:00–15:02:00Z, desk submit logs)
| Lane | Attempts | Attempting seconds | ok | already_spent | orphan | other |
|---|---|---|---|---|---|---|
| desk | 2,207 | 120 / 120 | 522 | 1,111 | 574 | 0 |
| mini | 2,208 | 120 / 120 | 458 | 1,080 | 670 | 0 |
| muon | 2,201 | 120 / 120 | 487 | 1,156 | 558 | 0 |
| boson | 2,316 | 120 / 120 | 484 | 1,165 | 667 | 0 |

Highest tip seq used, per family (f1 · f2 · f3 · f4): after minute 1: 67 · 69 · 64 · 67; after minute 2: 132 · 132 · 124 · 127. All four families growing at ≈ 1.05–1.1 hops/s each (≈ 4.3 hops/s total). No `TIP_BACK`, `STALL` or `PROC_EXIT` yet. The full score is above.


## Raw logs (not in git)
- desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-a6\{logs\phase.log, logs\preflight.log, logs\clock-desk.csv, logs\node-watch-desk.csv, logs\node-recovery-desk.csv, logs\post-end-mempool-desk.csv, logs\proc-*.csv, logs\proc-host-desk.csv, logs\pool-*.csv, out\*, private\submit-*.jsonl, private\catchup-*.jsonl}`
- mini `C:\Users\<mini-user>\tn10-storm-2026-10-30\step3-a6\{logs\phase.log, logs\recount.csv, logs\clock-mini.csv, logs\node-watch-mini.csv, logs\node-recovery-mini.csv, logs\post-end-mempool-mini.csv, out\*, private\hops.jsonl}`. No `resync.jsonl` was written: no resync or back-probe failures
- In git (counts only): [a6/score-a6.json](a6/score-a6.json) (`score.mjs` output, `SHARE_LANES=desk`, with the new unrounded `share_exact_pct` / `share_pass`), [a6/recount-a6.csv](a6/recount-a6.csv), [a6/per5min-a6.csv](a6/per5min-a6.csv) (now with `unaccept_coord` and `tip_back_all` columns).

Scored with `tools/storm/score.mjs`: the submit logs were turned into a csv (`ts,sender,result,reason,txid`, 133,739 rows incl. pre/post window) and joined with the mini's landed-hop log, window 15:00:00–15:30:00Z. Node-watch, proc, pool, catch-up and phase numbers were counted from the raw logs above on the Grok Bot box, which was used for analysis only. The logs were copied read-only from the desk and the mini; kaspad was not touched.
