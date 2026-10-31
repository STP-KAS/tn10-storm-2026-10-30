# a12 — 2-hour run, same setup as a11, Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Why: a11 scored 9/10 (only criterion 3, landing 98.92 %, network floor). Same code and setup; only change is lane funding sized to the a11 burn (RUNBOOK 14).
- Config: tag s3a12, 4 families, rate 5, lanes desk/mini/muon/boson, `usable_min_tkas` desk 7,000 / mini 9,000 / muon 11,000 / boson 32,000. Family check 15:35Z, **START 15:45Z (16:45 CET), END 17:45Z (18:45 CET)**, RBF sweep END+75 s / 3 / 6 min, census 17:55Z, recovery to 18:05Z.
- Funding 14:59–15:06Z (`fund-lanes12.mjs`, 111 txs, fees 1.99 tKAS): desk 808 coins / 8,056 usable tKAS, mini 918 / 10,359, muon 1,028 / 12,660, boson 3,579 / 36,807.
- Mini: `mini-a8.ps1` (kit8) started 14:58Z, `PREFLIGHT_GENESIS exit=0` (3 coins ≥ 15 tKAS per genesis key). Mini kaspad untouched since the 11:10Z restart.
- Desk: `desk-a11.ps1` (kit10, pwsh 7, detached) started 14:58Z, clock +1.6 / +2.2 ms, `GUARD_PRE exit=2 refused=1` (refused before the handoff, as required).
- Pre-START census 15:06Z (`mempool-ro.mjs --save-pre`): desk 1 own (the a10 leftover with no live input), mini 0.
