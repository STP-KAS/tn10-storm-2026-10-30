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
2. Start `node-watch` (every 5 s) to `node-watch-desk.csv`, plus `hwlog-desk.csv`.
3. Test the guard: start senders with no handoff file → must be refused.
4. Wait for the automatic handoff from the mini (≤ 1 min after genesis).
5. Start all lanes together; confirm every lane is on before the window counts.
6. 30 min run at the step rate. Watch RPC time (< 50 ms) and accepted share (≥ 90 % per lane).
7. Stop; post-end mempool and recovery to `post-end-mempool-desk.csv` and `node-recovery-desk.csv` (≤ 5 within 10 min).
8. Ladder: 4 families at 3× the rate, then 8 families at the base rate, each its own run.

## Miner and wallet

- Cap the miner to a few threads; lower it if RPC time climbs.
- Confirm block rewards arrive; send a small test amount to the mini wallet and confirm it is in a block.
