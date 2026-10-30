> Kaspa Testnet-10 only. Internal self-test, no Pulse.

# Step 3 base · review (attempts a1–a3)

| Attempt | Result |
|---|---|
| a1 | aborted before launch, `no_handoff` (the guard worked) |
| a2 | full window, 4.29 hops/s, FAIL (re-scored on 30 Oct criteria). [ATTEMPT-a2](ATTEMPT-a2.md) |
| a3 | full window, clean END, ~2.37 hops/s, **FAIL**. [ATTEMPT-a3](ATTEMPT-a3.md) |

## a3 against the PLAN criteria
| Criterion | Result | Detail |
|---|---|---|
| Every lane ≥ 1 attempt in each of 1,800 s | **FAIL** | mini 1,800 ✅ · muon 1,790 · desk 1,663 · boson 1,397 |
| Hops land in ≥ 99 % of seconds | **FAIL** | 98.6 % over the 356 s that were measured; the hop log stopped at 10:11:57 (coordinator STALL), so the rest of the window is unmeasured |
| Non-contention rejects ≤ 1 % per lane | **PASS** | 0 % on all lanes (submit-level; pre-submit errors not logged) |
| Each lane ≥ 15 % of landed hops | **FAIL** | desk 40.1 · boson 40.3 · muon 15.2 · **mini 4.4** (first 356 s only) |
| Node RPC < 50 ms | **PASS** | desk max 38 ms, mini max 19 ms |
| Logs 1 row / 5 s, full window, desk + mini | **PASS (node-watch)** / FAIL (hop log) | node-watch 359/360 rows each; landed-hop log covers only 10:05–10:11 |
| Back to baseline ≤ 10 min (mempool ≤ 5) | **PASS** | desk 2 / mini 0 at the first post-END row |
| 29 Oct missing items | mostly PASS | handoff auto-copy ✅ · guard ✅ · post-end mempool + clock on both ✅ · node-watch ✅ · **all four lanes on together ❌** (boson missing 10:05:00–10:07:52) |

## Score: 4 / 10
- **For:** clean, unattended detached run that survived two orchestrator restarts; clean END and recovery; both nodes healthy throughout (rpc ≤ 38 ms, synced, 8 peers); zero non-contention rejects; the new post-end mempool files exist; first 6 minutes ran at 4.43 hops/s, the best rate so far.
- **Against:** a known-wrong boson host was committed and reused, so boson missed 172 s. The independent hop counter stopped itself after 7 minutes, so most of the window has no independent landing evidence. Throughput fell to ~1.9 hops/s for the last 23 minutes (≈ 2.37 average, below a2's 4.29), most likely because the desk and boson lanes ran out of funding coins. Mini's share was 4.4 %.

## Fixes per failure (all for a4)
| Failure | Fix |
|---|---|
| Lanes not attempting every second (boson start) | Lane endpoints in config, not in the script: boson = `boson-10.kaspa.red`. **Preflight before START**: DNS + wRPC connect + `getServerInfo` for every lane; launch aborts if any lane fails. Sender logs DNS errors as `dns`, not `connect timeout` |
| Lanes not attempting every second (desk/boson fade) | **Fund each lane key with ≥ 300 funding coins** before the run (TN10 tKAS split from the bot wallet or desk wallet, no mining). Preflight refuses to start a lane with < 200 coins. Log the pool size every 5 s per lane |
| Lanes not attempting every second (muon) | Health probe: reconnect at once and keep submitting on a second connection; mark `node_dead` only after 3 failed probes in a row |
| Hops in ≥ 99 % of seconds unmeasured | Coordinator must **never** write STOP or exit on STALL during a self-test: log `STALL`/`GAP` and keep going. Resync timeout 5 s → 30 s, with the hop-walk batched from the last *seen* tip. Plus an after-END chain recount (walk each family from its start outpoint) as a second, independent count |
| Mini share 4.4 % | Structural: the mini lane goes desk → tunnel → mini and loses the race. Either run the mini lane's sender on the mini itself (local rpc ~2 ms), or for the share criterion count the mini lane against its own node only. **This is a decision for stp**, since the plan says all senders go on the desk |
| Void END line | `desk-a3.ps1`: read dates with `ConvertFrom-Json -DateKind String`; fail hard on an empty `$END`/`$T0` instead of falling through |
| Pre-submit errors not counted | Log builder/connect errors into the submit log as `result=error` with a timestamp, so they count toward the ≤ 1 % rule |
| Desk clock −88 ms | Still needs a one-time admin `w32tm /resync` (or set up the NTP service) on the desk |

## Recommendation for a4 (not run)
Same base (4 families, rate 5, 30 min). Before starting: (1) the endpoint fix + lane preflight, (2) top up all four lane keys to ≥ 300 coins and check counts read-only, (3) coordinator no-stop-on-stall + 30 s resync + after-END recount, (4) pre-submit errors in the submit log, (5) the pwsh 7 date fix, (6) stp's decision on where the mini lane sender runs. **Fresh genesis** instead of reusing a2's families, so seq deltas and the recount start from zero.
