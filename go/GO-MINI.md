> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# GO-MINI · mini PC main node · self-test 2026-10-30

## Role

Main node and genesis. No sender lanes, no miner.

## Steps

1. Step 1 checks (read-only): synced, peers ≥ 8, clock within 100 ms of NTP (log offset to `ntp-mini.csv`), ≥ 100 GB free.
2. Start `node-watch` (every 5 s) to `node-watch-mini.csv`, from T-15 min until recovery.
3. Genesis for 4 families (8 families for the Step 5 run); write the handoff file.
4. Confirm the automatic copy to the desk within 1 minute; log `HANDOFF ok` with time in `phase.log`.
5. After stop: post-end mempool to `post-end-mempool-mini.csv` and NTP to `ntp-mini.csv`; recovery to `node-recovery-mini.csv` (mempool ≤ 5).
6. Repeat 3–5 for each ladder run (4 families at 3×, then 8 families at base rate).
