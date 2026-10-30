> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# GO-BOT · Grok Bot box · self-test 2026-10-30

**Not trusted for the core test** (host pauses on 29 Oct cut the box lanes to 19:24–19:33 UTC). No sender lanes on the box.

## Role

- KNS lane only, as before. Not important for this test; its result does not affect pass or fail.
- Sends go through public TN10 nodes; there is no node on the box.

## Steps

1. Log box NTP offset to `ntp-box.csv` (informational).
2. Run the KNS lane during the run window; log to `phase-box.log`.
3. Stop with the desk's stop.
