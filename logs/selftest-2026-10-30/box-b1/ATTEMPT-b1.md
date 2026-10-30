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

## Expected score
Criteria 1 (clock), 2 (every second: 0 attempts 19:20:00–19:21:43) and 3 (landing ≥ 99 %) fail. The rest is scored after END from the box submit logs + mini hop log/recount.
