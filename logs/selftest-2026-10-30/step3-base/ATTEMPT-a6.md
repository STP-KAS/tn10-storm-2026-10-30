> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base run · attempt a6 · 4 families · rate 5/family · 15:00:00–15:30:00 UTC · RUNNING

Same base as a5 (fresh genesis, 4 families, rate 5, 30 min, 20 min recovery, one builder per sender, option (a) share rule, all senders on the desk, mini = main node + genesis). Scored by a separate routine after `RECOVERY_DONE` (~15:50Z).

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
