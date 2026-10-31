# a10 — 2-hour confirmation (same setup as a9), Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Window **07:15–09:15Z** (08:15–10:15 CET), family check 07:07Z, 4 families, rate 5, lanes desk/mini/muon/boson, same lanes and keys as a9.
- New: criterion 9 = own-tx census at END + 10 min (09:25Z), `desk-a10.ps1` (kit10), `mempool-ro.mjs` with `--pre` baseline taken 06:41Z: **3 own tx (desk), 6 (mini) already stuck before START** (a9 leftovers, RUNBOOK 11).
- Prep: genesis keys 4 coins ≥ 15 tKAS each; lanes 600/600/600/800; `clock-offset.mjs` fix deployed.
- Mini orchestrator first try aborted at 06:41Z (`LAUNCH_ABORT reason=genesis_funding`: the genesis top-up had run dry, without `send`); relaunched 06:48Z after funding, `PREFLIGHT_GENESIS exit=0`.
