> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# GO-BUILD · desk PC · self-test 2026-10-30

You are **Grok Build** on the desk. All attention for the core test is here.

## Role

- All sender lanes: private-node lanes plus the public-node lanes on **muon** and **boson**.
- Handoff receiver from the mini.
- Capped CPU miner (modest).
- Failover node and coordinator if the mini fails.

Run directory: `C:\Users\Fermi\tn10-storm-2026-10-30`.

## Steps

1. Step 1 checks (read-only): synced, peers ≥ 8, clock within 100 ms of NTP (`ntp-desk.csv`), ≥ 100 GB free.
2. Start `node-watch` (every 5 s) to `node-watch-desk.csv`, plus `hwlog-desk.csv`. Start the receiver: `node tools/storm/handoff-receiver.mjs --dir <run> --port 18600` (needs `<run>\private\handoff.token`, same token as the mini; Node already has a Private-profile inbound firewall rule, no admin needed).
3. Test the guard: `launch-desk.ps1 … -GuardOnly` with no handoff file → must print `REFUSED` (exit 2). The guard (`handoff-guard.mjs`) refuses: missing (10), no/ wrong sha256 (11/12), bad JSON (13), `created` before the run date (14), wrong family count (15), a `test:true` file unless `-AllowTest` (16).
4. Wait for the automatic handoff from the mini (≤ 1 min after genesis); the receiver logs `HANDOFF received` in `logs/handoff-receiver.log`.
5. `launch-desk.ps1 -Kit … -Config … -RunDate 2026-10-30 -Families 4 -Lanes desk,muon,boson -LaneNodes @{…}`: logs clock offset to `logs/clock-desk.csv`, runs the guard, imports, then starts every lane in the same second; confirm every lane is on before the window counts.
6. 30 min run at the step rate. Watch RPC time (< 50 ms) and accepted share (≥ 90 % per lane).
7. Stop; post-end mempool and recovery to `post-end-mempool-desk.csv` and `node-recovery-desk.csv` (≤ 5 within 10 min).
8. Ladder: 4 families at 3× the rate, then 8 families at the base rate, each its own run.

## Miner and wallet

- Cap the miner to a few threads; lower it if RPC time climbs.
- Confirm block rewards arrive; send a small test amount to the mini wallet and confirm it is in a block.

## Clock

`w32tm /resync` needs admin (Access denied). Until an admin fixes it, `launch-desk.ps1` measures the offset vs NTP at start (`clock-offset.mjs`, SNTP, no admin) and logs it to `logs/clock-desk.csv`; correct per-second counts by that offset. Self-test 30 Oct: desk clock **≈ 89 ms ahead** (inside the 100 ms limit, marginal); mini ≈ 43 ms behind. Proposed one-time admin fix: `w32tm /config /manualpeerlist:"pool.ntp.org,0x8" /syncfromflags:manual /update` then `w32tm /resync`, and set `SpecialPollInterval` to 900 s.
