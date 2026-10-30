> Kaspa Testnet-10 only. Internal self-test, no Pulse. Running status, updated with each attempt.

# Status · 30 Oct 2026 · a6 running (START 15:00:00Z, END 15:30:00Z)

| Attempt | Score | hops/s | Main flaw |
|---|---|---|---|
| a4 | 6/10 | 4.09 | fade after 15 min (shared builder, walk pile-up) |
| a5 | 7/10 (8/10 under the 30 Oct RPC rule, record unchanged) | 2.93 | 3 families frozen on a phantom tip one hop ahead |
| a6 | running | – | – |

## Open flaws and issues
- **Desk clock** −147 ms at a6 preflight, drifting ≈ −0.33 ms/min. NTP fix needs admin on the desk (`w32tm` and elevated scheduled task: access denied). Criterion 1 fails until then; logged as a known failure (`clock_gate: log`).
- **Virtual-chain reorgs un-accept the newest hop** often (rehearsal: 39 `UNACCEPT` in 5 min, 1 family). Root of a5's phantom tips. a6 handles it by stepping back; a6 measures whether it holds with 4 lanes.
- Mini node 24 libuv assert at exit after wRPC disconnect (worked around by parsing preflight lines).
- Desk orchestrator must run under pwsh 7 (Windows PowerShell 5 died silently in the guard step).

## Fixed (in a6)
Tip step-back (8 states, `TIP_BACK`), coordinator `UNACCEPT` + back probe + logged resync errors, skip-tick while catching up, preflight clock gate + genesis-key funding check, `proc-host-desk.csv`, broker `EPIPE`. Rehearsal PASS (recovery 1.13 s).

## Being done / next
1. a6 scoring after `RECOVERY_DONE` (~15:50Z).
2. Iterate to 10/10, then a **2-hour run of the same setup that must also score 10/10** (PLAN, 30 Oct), then 3× rate, then 8 families.
