> **Experimental. We are just trying this.** [Disclaimer](../DISCLAIMER.md) · [Home](../README.md) · [Plan](../plan/PLAN.md) · Kaspa Testnet-10 only. Internal self-test; no Pulse involvement.

# GO rules · 2026-10-30

- TN10 only. tKAS has no value.
- Times in UTC first, Brussels (CET) second.
- Desk and mini kaspad stay hands off: read and log only.
- Desk paths use the form `C:\Users\Fermi\...`. No keys, seeds, addresses, IPs, txids, hostnames or covenant ids in git.
- Every change during a run goes in `phase.log` as a DEVIATION line.

| Machine | Run sheet | Role |
|---|---|---|
| Mini | [GO-MINI.md](GO-MINI.md) | Main node, genesis, handoff out |
| Desk | [GO-BUILD.md](GO-BUILD.md) | All sender lanes, handoff in, capped miner, failover |
| Grok Bot box | [GO-BOT.md](GO-BOT.md) | KNS only; not trusted for core test |
