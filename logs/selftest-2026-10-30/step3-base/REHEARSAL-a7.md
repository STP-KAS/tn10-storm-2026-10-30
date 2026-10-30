> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# a7 rehearsal · fire on new tip · 2 families · desk, muon, boson · 16:55:00–17:05:00 UTC · **FAIL (desk share 13.19 % < 17 %)**

Purpose (a7 plan #2): lift the desk lane's landed-hop share with **fire-on-new-tip** before a7. Pass = desk share ≥ 17 % and nothing else worse.

Setup: a7 `sender.mjs` (kit7 on the desk), fresh genesis of 2 families on the desk node (16:51:55–56Z, launch paths `…-reh7-f1..2`), coordinator on the desk node, 3 lanes `--source self` with one builder each, rate 5/s per family per lane. **Mini lane left out** (mini not touched; the share rule is the desk lane's share anyway). Preflight 16:54:00Z: desk 400 coins (wRPC 21 ms), muon 398 (282 ms), boson 391 (97 ms); **clock +2.0 ms pass** (first run after the desk clock fix).

| Lane | Attempts | Seconds attempting | submit ok | landed | already_spent | orphan | other | fired on new tip | `tip_age_ms` p50 / p95 | **share** |
|---|---|---|---|---|---|---|---|---|---|---|
| desk | 5,759 | 600 / 600 | 1,818 | 229 | 2,980 | 961 | **0** | 1,828 | 221 / 621 | **13.191 %** |
| muon | 5,477 | 600 / 600 | 1,633 | 152 | 3,032 | 812 | **0** | 1,364 | 304 / 605 | 8.756 % |
| boson | 5,745 | 600 / 600 | 1,794 | 1,355 | 2,880 | 1,071 | **0** | 1,588 | 275 / 591 | 78.053 % |

Totals: **1,736 hops in 600 s = 2.89 hops/s** (2 families; 29 Oct: 1.96), all attributed; hops landed in **579 / 600 s (96.5 %)**; 212 `UNACCEPT`, 22 `TIP_BACK` lines (all recovered, no freeze), 0 `STALL`, 0 `SENDER_OFF`, 0 non-contention errors.

## Finding
- Fire-on-new-tip works mechanically: the desk fires first (lowest `tip_age_ms` p50, 221 ms) and its node **accepts** as many submits as boson's (1,818 vs 1,794 ok).
- But only **13 %** of the desk's accepted submits land, against **76 %** of boson's. The race is decided **after** submit, by which competing tx reaches the TN10 miners' block templates first. That is propagation/network position, not sender latency, so no sender change on the desk can fix it.
- With a6's 14.97 % (4 lanes) and this 13.19 % (3 lanes, fire on tip), the desk-share rule cannot be met by code. Per a7 plan #2b this is **stp's decision** (option: score the desk lane like the others: attempts every second + non-contention errors ≤ 1 %, share reported).

## Decision
**a7 NOT launched** (the rehearsal gate was "≥ 17 %"). Fire-on-tip stays in the code (harmless, desk fires first). Waiting for stp on the share rule.

Raw (not in git): desk `C:\Users\<desk-user>\tn10-storm-2026-10-30\step3-reh7\`.
