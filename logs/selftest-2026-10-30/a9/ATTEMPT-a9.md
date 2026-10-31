> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 · attempt a9 · second 2-hour confirmation of the a7 setup · 4 families · rate 5 · 120 min

Same as a8 (lanes desk, mini via tunnel, muon, boson; kit8 coordinator with hop-log back-fill + `RECOUNT_MATCH`). The box is not part of the run.
a8 scored 7/10: the boson lane pool ran dry at 01:40Z (criteria 2 and 6), and the mempool criterion 9 failed on a backlog that was there before START.

## Fixes vs a8
1. **Lane funding for the whole window.** a8 boson burned ≈ 55 tKAS/min (it lands ≈ 68 % of hops and pays those fees); its 400 coins lasted ≈ 95 min. Now desk 600, mini 600, muon 600, **boson 800** coins of 16 tKAS (Grok Bot TN10 wallet, 34 txs incl. 1 prep tx, fees ≈ 0.6 tKAS).
2. **Preflight checks usable value, not only count** (`preflight.mjs`, kit9): `usable_tkas` = Σ (coin − 3 tKAS) over pool coins, must be ≥ the lane's `usable_min_tkas` (desk 4000, mini 2000, muon 4000, boson 8600 ≈ 2 h burn × 1.3); `min_coins` 400. Read-only check at 03:07Z: desk 5,391 · mini 7,140 · muon 5,924 · boson 10,632 tKAS usable, all pass. (Before funding the same check failed all four lanes, e.g. desk 394 coins but only 110 tKAS above 15 tKAS coins.)
3. **Low-pool alert** (`sender.mjs`, kit9): `POOL_LOW sender=<lane> coins=<n>` in phase.log when a pool drops under `pool_low` (100), `POOL_OK` when it recovers (+20).
4. Funding script: the treasury holds ~1.47 M small mined coins, so a full UTXO query takes ~40 s and timed out on muon; it now prepares 29 coins of 700 tKAS once and uses one per 40-output batch (via boson).

## Mempool backlog (read-only census, 31 Oct 02:46Z, `mempool-ro.mjs`, two snapshots 60 s apart)
| Node | Entries | Ours | Others | Orphans | Still there after 60 s | Avg fee |
|---|---|---|---|---|---|---|
| desk | 52 | 0 | 52 | 0 | 52 / 52 | ≈ 0.094 tKAS |
| mini | 677 → 726 | 0 | all | 0 | 676 / 677 | ≈ 0.008 tKAS |

None of the entries pay to our lane or genesis keys: it is other TN10 traffic (1 input / ~2 outputs). The desk's 52 sat unchanged through all of a8 (stuck, not draining); the mini's set is mostly stuck as well, with new arrivals. It does not come from the storm and does not change during a run.
**Criterion 9 is scored strictly (mempool ≤ 5 within 10 min after END), as the rule stands.** An *unofficial* line is also reported: back to **pre-run baseline + 5** within 10 min. Changing the rule is stp's decision.

## Launch (UTC / CET)
| | UTC | CET |
|---|---|---|
| orchestrators started (desk pwsh 7 kit9, mini kit8) | 03:07 | 04:07 |
| genesis / handoff | 03:17 | 04:17 |
| **START** | **03:25** | **04:25** |
| **END** | **05:25** | **06:25** |
| recovery + recount done | ~05:45 | ~06:45 |

Mini `PREFLIGHT_GENESIS exit=0` (each genesis key down to 1 coin ≥ 15 tKAS: top up before a10). Result: scored after recovery.
