> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Box run b2 · plan

**Why.** b1 (6/10) showed the box only works as a sender while an agent session is active, and that senders stayed `SENDER_OFF` after a box suspend killed their WebSockets. b2 repeats b1 with two fixes (stp, 30 Oct: "solve it run again").

## Fixes vs b1
1. **Lane reconnect** (`kit/sender.mjs`): after 3 failed health probes (≈ 6 s) the sender drops its socket and opens a new one to the same node, rebinding the coin pool. On failure it backs off 2, 4, 8 … 30 s. Logged as `RECONNECT_OK` / `RECONNECT_FAIL` in phase.log. A `control/KILLWS-<lane>` file forces a socket drop (rehearsal hook).
2. **Box held awake for the whole run**: the agent keeps foreground commands of ≤ 25 s running back to back from preflight through END and recovery, no idle gaps (`KEEPAWAKE_START` in phase.log). The box health logger flags any gap > 7 s.

## Setup
Same as b1: 4 box lanes (muon, muon2, boson, boson2 over public wRPC), one builder per sender, the mini runs fresh genesis (4 families, new launch paths `…-b2-f1..4`), coordinator, node-watch, post-end and recount (kit6 unchanged). Handoff copied from the mini to the box by the agent. Rate 5.

Schedule (UTC): genesis 20:45Z, **START 21:00:00Z, END 21:20:00Z** (20-min window so run + scoring fit one agent session), recovery 5 min to 21:25Z. Times in CET = UTC+1.

Funding: none needed. Preflight: every box lane 400 coins (floor 200), every mini genesis key 2 coins ≥ 15 tKAS.

## Rehearsal (20:36Z, 3 min, one muon lane on old b1 families)
Socket killed at 20:36:33Z → `SENDER_OFF node_dead` 20:36:37Z → `RECONNECT_OK ms=379` 20:36:38Z → `SENDER_ON` 20:36:39Z; submits continued after. **Pass** (≈ 6 s total outage).

## Scoring
a7 criteria, 20-min window (1,200 s). Clock = known failure (box NTP blocked; preflight offset −714 ms).
