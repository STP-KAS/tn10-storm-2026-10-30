> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Box run b1 · 4 families · rate 5 · 4 box lanes · START 19:20:00Z, END 19:50:00Z, recovery to 20:10Z

**Status at 19:23Z: running, but 10/10 is already impossible** (box suspends; see flaws). Scoring after END.

## Launch (UTC)
| Time | Event |
|---|---|
| 18:43–18:50 | lane keys topped up to 400 × 16 tKAS (4 keys, 28 txs, 0.504 tKAS); genesis keys 3 × 16 tKAS (1 tx) |
| 18:52:11 | mini `PREFLIGHT_GENESIS exit=0`, coordinator up (kit6, unchanged) |
| 19:06:56–59 | GENESIS f1–f4 on the mini; handoff exported, copied to the box by the agent, sha256 equal on both sides |
| 19:08:20 | box `PREFLIGHT exit=20`: 4 lanes pass (400 coins each), **clock +159 ms → LAUNCH_ABORT (safe)** |
| 19:09:17 | relaunch with 15 s clock keeper: abort again (clock +450 ms) |
| 19:10:29 | relaunch with `clock_gate: log`, stepping off: `PREFLIGHT exit=0` (clock +247 ms known_failure), 4 senders up (9 min 31 s before START, rule says ≥ 10) |
| 19:18:10 / 19:19:31 | **box frozen 156 s and 56 s** (health gaps; the box ran no agent call in that time). All 4 senders `SENDER_OFF node_dead` at 19:19:40 (WebSockets dead after the pause, no reconnect) |
| 19:20:00 | START: 0 attempts (senders off); mini coordinator `STALL` f1–f4 at 19:21:00 |
| 19:21:41 | senders restarted by hand (`SENDER_RESTART`) |
| 19:23:28 | 368 hops since the restart (f1 95 · f2 90 · f3 92 · f4 91 ≈ 3.5 hops/s); lanes ~17 attempts/s each, 0 bytes in every sender `.err` |

## Flaws found
1. **The box is suspended when no agent call is running.** Health gaps of 156 s and 56 s exactly while the agent was idle; detached processes (setsid/nohup) freeze with it. This is the box "freeze": it is not load (CPU ≤ 22 %, load1 < 0.7, ≥ 2.9 GB free). A box sender run is only valid while an agent call keeps the box awake.
2. **Box clock is not usable for the clock gate.** UDP 123 is blocked; the HTTPS (cloudflare trace) offset jumped −942 → −34 (after a step) → +313 → +800 → −171 … +698 ms within minutes, consistent with the suspend/resume above. Stepping (`sudo date`) could not keep it within 80 ms.
3. **Senders don't reconnect after a pause**: after 3 failed health probes a lane stays `SENDER_OFF` forever. Fix for b2: reconnect the wRPC client on `node_dead` (and in the builder).
4. No mini lane from the box (the reverse tunnel ends on the desk).
5. Hop-log back-fill not done (see PLAN-b1); recount-vs-hoplog check done at scoring.

## Expected score (written during the run)
Criteria 1 (clock), 2 (every second: 0 attempts 19:20:00–19:21:43) and 3 (landing ≥ 99 %) fail. The rest is scored after END from the box submit logs + mini hop log/recount.

## Run after 19:23 (UTC)
| UTC | Event |
|---|---|
| 19:24:30–19:50:30 | agent held the box awake with foreground loops (sender check + health tail every 25 s, `logs/keepawake.csv`, 61 rows, max gap 27 s). All 4 senders alive at every check; **no restart needed** |
| 19:33:21 | detached keepalive started (`nohup`, timestamp every 1 s + HTTPS HEAD every 10 s) |
| 19:50:01 | END; senders stop. Mini `RECOVERY` mempool 4 at 0 s |
| 19:51:07–13 | mini recount f1–f4: 1,520 · 1,510 · 1,503 · 1,505 = **6,038** |
| 19:50:36–20:00:54 | idle test: no agent command, only the detached keepalive running |

## Score: **6 / 10** (a7 criteria; clock = known failure)
| # | Criterion | Result | Numbers |
|---|---|---|---|
| 1 | Pre-checks incl. clock ≤ 100 ms | **FAIL (known)** | box clock unusable (HTTPS offset −985 … +800 ms; NTP blocked). Mini +49.4 / +19.3 ms |
| 2 | Every lane ≥ 1 attempt in each of 1,800 s | **FAIL** | 1,696–1,697 / 1,800 (senders off 19:20:00–19:21:43 after the pre-START suspend) |
| 3 | Hops land in ≥ 99 % of seconds | **FAIL** | **92.00 %** (hop log). 6,035 hops = 3.35 hops/s |
| 4 | Non-contention ≤ 1 % per lane | **PASS** | 0 non-contention errors in 121,110 attempts |
| 5 | (desk lane → n/a) box lanes: 0 errors | **PASS** | muon 30,522 · muon2 30,513 · boson 30,065 · boson2 30,010 attempts, 0 errors |
| 6 | Lanes attempt every second (+ shares reported) | **FAIL** | as #2. Shares: boson2 32.7 · boson 31.3 · muon 21.2 · muon2 14.8 % |
| 7 | Node RPC p95 < 50, max < 250 ms (mini) | **PASS** | p95 **2** ms, max **16** ms, 359 rows, 0 errors |
| 8 | Logs 1 row / 5 s | **PASS** | mini node-watch max gap 5.06 s; box health no gap > 8 s inside the window |
| 9 | Back to baseline ≤ 10 min | **PASS** | mini mempool 4 at 0 s after END |
| 10 | Recount vs hop log (0.5 % tol.) | **PASS** | recount 6,038 vs hop log 6,035 → diff 3 (0.05 %) **RECOUNT_MATCH** |

## Held-awake segment vs frozen start
| Segment (UTC) | s | Hops | hops/s | Land secs | Every-second | Errors |
|---|---|---|---|---|---|---|
| 19:20:00–19:24:30 (after two box suspends; senders off until 19:21:43) | 270 | 582 | 2.16 | 60.0 % | fail (166–167 / 270) | 0 |
| 19:24:30–19:50:00 (**agent held box awake**) | 1,530 | 5,453 | **3.56** | **97.65 %** | **pass** (1,530 / 1,530 all lanes) | 0 |

**No freeze while the box was held awake**: no health gap > 8 s and no sender died 19:24:30–19:50:00. Remaining gap to 10/10 in that segment is landing (97.65 % < 99 %): all lanes go through public nodes, a7 had a local node lane.

## Detached keepalive test (stp's idea)
After END the foreground loop was stopped and only a detached keepalive ran (1 s timestamps + HTTPS HEAD every 10 s), 10 min, no agent command. `keepalive.log` gaps > 3 s: **19.4 s at 19:54:10** and **45.2 s at 20:00:03** (box health shows the same gaps). While the agent loop ran (19:33–19:50) there were no gaps. **Result: a detached active process does NOT stop the freeze**; only an active agent session does. Keepalive stopped 20:01.

## Next (b2)
Sender reconnect on `node_dead`; agent-held session for the whole run (start the hold before preflight); clock criterion stays a known failure on the box.
