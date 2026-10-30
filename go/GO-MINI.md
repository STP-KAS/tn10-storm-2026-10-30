> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# GO-MINI · mini PC main node · self-test 2026-10-30

## Role

Main node and genesis. No sender lanes, no miner.

## Steps

1. Step 1 checks (read-only): synced, peers ≥ 8, clock within 100 ms of NTP (log offset to `ntp-mini.csv`), ≥ 100 GB free.
2. Start `node-watch` (every 5 s) to `node-watch-mini.csv`, from T-15 min until recovery.
3. Genesis for 4 families (8 families for the Step 5 run); then `node handoff.mjs export > <run>\handoff.json` (now stamps `created`, `test:false`).
4. Push it at once: `node tools/storm/handoff-push.mjs --file <run>\handoff.json --url <desk receiver URL> --token-file <run>\private\handoff.token`. It sends the sha256, the desk re-hashes, and the push only logs `HANDOFF ok sha256=… ms=…` to `phase.log` when both hashes match (retries 50 s, else `HANDOFF FAIL`). URL and token live only in the local run folder. Self-test 30 Oct: 52 ms. Use the kit's bundled `node\node.exe` (node is not on PATH on the mini).
5. After stop: post-end mempool to `post-end-mempool-mini.csv` and NTP to `ntp-mini.csv`; recovery to `node-recovery-mini.csv` (mempool ≤ 5).
6. Repeat 3–5 for each ladder run (4 families at 3×, then 8 families at base rate).
