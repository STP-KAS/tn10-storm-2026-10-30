# a13 — 2-hour run, same setup as a12, Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- Why: a12 scored 5/10, failed by 3 home-network outages (RUNBOOK 15). stp 19:54 CET: "Keep going until 10/10. Full authority." Same code, config and funding as a12; landing rule unchanged (99 %, stp's decision).
- Config: tag s3a13, 4 families, rate 5, lanes desk/mini/muon/boson, `usable_min_tkas` desk 7,000 / mini 9,000 / muon 11,000 / boson 32,000. Family check 19:35Z, **START 19:45Z (20:45 CET), END 21:45Z (22:45 CET)**, RBF sweep END+75 s / 3 / 6 min, census 21:55Z, recovery to 22:05Z.
- Desk NIC (checklist 18, RUNBOOK 15): no link-down event since the last a12 outage (16:29Z). Energy-Efficient Ethernet and Idle power down restriction were already off on the desk card; Windows "allow the computer to turn off this device" is at its default (allowed) and could not be changed: the agent session on the desk is not elevated. Nothing changed on the NIC, no driver update.
- Pre-launch RBF sweep 18:59Z (dry run): desk 1 own / mini 1 own, both with no live input, so nothing to replace. They stay as pre-START leftovers.
- Funding 18:56–19:06Z (`fund-lanes13.mjs` = a12 script, 76 txs, fees 1.37 tKAS): desk 1,022 coins / 8,060 usable tKAS, mini 984 / 10,355, muon 1,407 / 12,651, boson 4,292 / 36,809.
- Pre-START census 19:06Z (`mempool-ro.mjs --save-pre`): desk 1 own, mini 1 own (the two leftovers above).
- Mini: `mini-a8.ps1` (kit8) started 19:07Z, `PREFLIGHT_GENESIS exit=0`; free RAM 1.9 GB before launch. Mini kaspad untouched since the 11:10Z restart.
- Desk: `desk-a11.ps1` (kit10, pwsh 7, detached) started 19:08Z, clock +1.3 / +0.8 ms, `GUARD_PRE exit=2 refused=1`.
- Genesis 4 families on the mini, `HANDOFF ok`, desk `PREFLIGHT exit=0` 19:35:05Z (desk 1,022 coins / 8,060 usable, mini 984 / 10,355, muon 1,407 / 12,651, boson 4,292 / 36,809; clock +1.5 ms), `guard exit=0`, `LAUNCH exit=0`.
- **START 19:45:00Z (20:45 CET)** (`START senders=desk,mini,muon,boson families=4 rate=5`). **END 21:45:00Z (22:45 CET).** No desk link-down event between launch and START.
