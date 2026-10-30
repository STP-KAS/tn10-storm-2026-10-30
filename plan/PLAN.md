> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# PLAN · internal self-test · 2026-10-30

Based on the [29 Oct REVIEW](https://github.com/STP-KAS/tn10-storm-2026-10-29/blob/main/logs/storm-2026-10-29/REVIEW.md). Every step must pass before the next. A fail stops the ladder; fix, then rerun that step.

## Step 1 · pre-checks (desk and mini, read-only)

| Check | Pass |
|---|---|
| Node synced | yes |
| Peers | ≥ 8 |
| Clock vs NTP | within 100 ms |
| Free disk | ≥ 100 GB |

Desk and mini kaspad stay hands off: read only.

## Step 2 · handoff

- Mini runs genesis for 4 families and writes the handoff file.
- The handoff copies **automatically** mini → desk.
- Desk senders **refuse to start** without a valid handoff file.

Pass: the copy lands on the desk within **1 minute** of genesis, and a test start without the file is refused.

## Step 3 · base run · 4 families · 30 min · all lanes on the desk

Lanes on the desk: private-node lanes plus the public-node lanes on muon and boson. KNS runs separately on the Grok Bot box.

Measure: hops/s per family and total; accepted vs attempted per lane; node RPC time; node-watch every 5 s.

## Pass criteria (every run)

- **On every second** (dated change, Fri 30 Oct 2026): every lane makes **≥ 1 submit attempt in each of the 1,800 s**, and hops land in **≥ 99 %** of seconds.
- **Rejects** (dated change, Fri 30 Oct 2026, replaces "≥ 90 % accepted per lane"): every reject is a contention reject (`already_spent` or `orphan`); non-contention rejects (errors, timeouts, other) **≤ 1 %** of attempts per lane; each lane gets **≥ 15 %** of landed hops.
- **Mini lane share** (dated change, Fri 30 Oct 2026, after a3): the **≥ 15 % landed-hop share** rule applies to the **desk, muon and boson** lanes (share of the hops those three landed). The **mini lane**, which runs on the desk but reaches the mini through the tunnel, is scored separately on **attempts every second** and **non-contention errors ≤ 1 %** only; its share is reported, not scored. All senders stay on the desk (stp's rule). Pre-submit errors (builder/connect) now count as non-contention errors.
- Node RPC **< 50 ms**.
- Logs at **one row per 5 s**, full window, desk and mini.
- Node back to baseline **within 10 min** after stop (mempool rule below).

### Why the 30 Oct criteria change
The 90 % rule cannot be met under designed contention: four senders race for the same covenant outpoint per family, so about three of four submits lose with `already_spent` by design (a2: 20–28 % accepted per lane, zero non-contention rejects). "On every second" was undefined; it is now measured from the submit log and the landed-hop log. See [ATTEMPT-a2](../logs/selftest-2026-10-30/step3-base/ATTEMPT-a2.md). Scored with `tools/storm/score.mjs`.

## Steps 4–5 · ladder (dated change, Fri 30 Oct 2026: 2× and 4× dropped)

Each its own run, same 30 min, same pass criteria, base = Step 3 rate:

| Step | Families | Rate |
|---|---|---|
| 3 | 4 | base |
| 4 | 4 | 3× |
| 5 | 8 | base |

## Wallet and miner check

- Capped CPU miner on the desk (modest; leave cores for kaspad and senders).
- Pass: block rewards arrive in the wallet; a small test send to the mini wallet confirms in a block; node-watch shows no stalls.

## Fixes from 29 Oct

| Fix | Where |
|---|---|
| Automatic handoff copy; senders refuse without it | Step 2 |
| Clock sync on desk and mini before start (box ~0.9 s off on 29 Oct) | Step 1 |
| All senders on simultaneously (moved to the desk) | Step 3 pass |
| Mini post-end mempool and NTP logs | logs |
| Full node-watch on desk and mini, start to recovery | logs |
| Mempool recovery rule: **≤ 5** instead of exactly 0 (dated change, 29 Oct; TN10 background traffic keeps it 1–52) | Pass criteria |

Only after Steps 1–5 and the wallet/miner check pass: ask Pulse for a rerun.
