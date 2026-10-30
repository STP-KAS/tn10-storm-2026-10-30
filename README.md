> **Experimental. We are just trying this.** [Disclaimer](DISCLAIMER.md) · Kaspa Testnet-10 only; tKAS has no value.
>
> **Part of [tn-master](https://github.com/STP-KAS/tn-master)**, the map of every TN10 storm. Named by the [11 Oct naming rule](https://github.com/STP-KAS/tn-master/blob/main/repos/INDEX.md): `tn10-storm-YYYY-MM-DD`.

# tn10-storm-2026-10-30 · internal self-test before any Pulse rerun

**Goal:** a clean internal pass, end to end, before asking Pulse for a rerun. No Pulse involvement in this test.

**Runs:** 4 families at base rate (30 min) → 4 families at 3× → 8 families at base rate. Each its own run, same pass criteria.

**Previous storm:** [tn10-storm-2026-10-29](https://github.com/STP-KAS/tn10-storm-2026-10-29) · [29 Oct REVIEW](https://github.com/STP-KAS/tn10-storm-2026-10-29/blob/main/logs/storm-2026-10-29/REVIEW.md).

## Based on the 29 Oct results

| Item | 29 Oct |
|---|---|
| 1 family | 0.81 hops/s |
| 2 families | 1.96 hops/s |
| 4 families | 3.24 hops/s |
| Box sender lanes | ran only 19:24–19:33 UTC |
| boson lane | 55 included of 5,314 attempts |
| Handoff mini → desk/box | copy failed; genesis looked not started |
| Box clock | ~0.9 s off |
| All 4 senders on in one counted second | never |
| Load | light (mempool peak ~60); node limits not reached |

## Roles (dated change, Fri 30 Oct 2026)

Governance and attention shift entirely to the **desk**.

| Machine | Role |
|---|---|
| **Desk** | All sender lanes: private-node lanes **and** the public-node lanes on muon and boson. Receives the handoff from the mini. Runs the capped CPU miner (modest mining). Failover node. |
| **Mini** | Main node. Runs genesis. Sends the handoff to the desk. |
| **Grok Bot box** | KNS lane only (not important for this test). **Not trusted for the core test**; no sender lanes. |

## Map

**[RUNBOOK](RUNBOOK.md)**: every problem a1–a7, how it was solved, and the launch checklist.

| File | What is in it |
|---|---|
| [plan/PLAN.md](plan/PLAN.md) | Steps, pass criteria, ladder (4 fam base · 4 fam 3× · 8 fam base), fixes from 29 Oct |
| [go/README.md](go/README.md) | Shared GO rules and roles |
| [go/GO-MINI.md](go/GO-MINI.md) | GO run sheet: mini PC main node |
| [go/GO-BUILD.md](go/GO-BUILD.md) | GO run sheet: desk PC (Grok Build) |
| [go/GO-BOT.md](go/GO-BOT.md) | GO run sheet: Grok Bot box (KNS only) |
| [logs/](logs/README.md) | Results after each run |

## Results

Placeholder. Each run's logs land under [logs/](logs/README.md).

Counts only: no txid, key, seed, IP, host, port, covenant id or wallet address in this repo.

---

Si vis pacem, para bellum.
