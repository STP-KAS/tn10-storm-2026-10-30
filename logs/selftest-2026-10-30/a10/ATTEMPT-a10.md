# a10 — 2-hour confirmation (same setup as a9), Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Window **07:45–09:45Z** (08:45–10:45 CET), family check 07:37Z, tag s3a10b, 4 families, rate 5, lanes desk/mini/muon/boson, same lanes and keys as a9.
- New: criterion 9 = own-tx census at END + 10 min (09:55Z), `desk-a10.ps1` (kit10), `mempool-ro.mjs` with `--pre` baseline taken 06:41Z: **3 own tx (desk), 6 (mini) already stuck before START** (a9 leftovers, RUNBOOK 11).
- Prep: genesis keys 4 coins ≥ 15 tKAS each; lanes 600/600/600/800; `clock-offset.mjs` fix deployed.
- Mini orchestrator first try aborted at 06:41Z (`LAUNCH_ABORT reason=genesis_funding`: the genesis top-up had run dry, without `send`); relaunched 06:48Z after funding, `PREFLIGHT_GENESIS exit=0`.
- **First slot (07:15Z) aborted** at 07:07Z: `PREFLIGHT exit=20`, boson usable 4,705 tKAS < 8,600 (800 coins but many small after a9). Boson topped up to 1,120 coins (+320 × 16 tKAS, ~8,865 usable). Both orchestrators and their child processes stopped (never kaspad), aborted run dirs kept as `step3-a10-abort`, fresh run dirs, relaunched 07:12Z for the 07:45Z window. The 07:07Z genesis of the first slot used 1 genesis coin per key (3 left each).
- Lesson (RUNBOOK 11): the funding target must count usable value, not coins; `fund-lanes` should top up to `usable_min_tkas`.
