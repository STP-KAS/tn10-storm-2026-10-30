# a11 — 2-hour run after the a10 fixes, Sat 31 Oct 2026

> Kaspa Testnet-10 only. Times UTC (CET = UTC+1).

- First slot (11:20–13:20Z) **aborted at 11:08Z before genesis** to apply the fixes (stp 12:07 CET, full authority). Logs kept as `step3-a11-abort1`.
- Fixes: mini kaspad graceful restart with `--ram-scale 0.4` (private 13.91 → 1.82 GB); KCC20 token output 0.2 → 1 tKAS (SDK storage mass 50,096 → 10,130); lanes funded by usable value. Details in RUNBOOK 13.
- Pre-START census 11:22Z: desk 1 own leftover, mini 0.
- Mini: `PREFLIGHT_GENESIS exit=0` 11:23Z, GENESIS families 1–4 included 11:49:55–11:49:58Z, handoff ok.
- Desk: preflight 11:50Z all lanes pass (desk 8,055 / mini 6,440 / muon 8,056 / boson 27,609 usable tKAS), clock −0.5 ms, `LAUNCH exit=0`.
- Window **12:00–14:00Z** (13:00–15:00 CET), tag s3a11b, 4 families, rate 5, lanes desk/mini/muon/boson. RBF sweep at END + 75 s / 3 min / 6 min, census 14:10Z.
- **START 12:00:00Z** (`START senders=desk,mini,muon,boson families=4 rate=5`).
- **Live hop mass (desk mempool, `mempool-diag.mjs`, 12:01Z):** our new hops storage mass **40,408–41,209**, compute 9,123 (old 0.2 tKAS hop: 200,586, the one pre-START desk leftover). About 5× lighter, as expected.
