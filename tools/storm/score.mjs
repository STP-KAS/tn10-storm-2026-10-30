// score.mjs <sub.csv: ts,sender,result,reason,txid> <hops.jsonl> <from_utc> <to_utc>
// Scores a run against the 30 Oct criteria. Prints counts only (no txids). TESTNET-10 ONLY.
import fs from "node:fs";
const [sub, hopsF, from, to] = process.argv.slice(2); const W0 = Date.parse(from), W1 = Date.parse(to), N = (W1 - W0) / 1000;
const hops = new Map(); for (const l of fs.readFileSync(hopsF, "utf8").split("\n")) if (l) { const h = JSON.parse(l); hops.set(h.txid || `bf:${h.family}:${h.seq}`, h); }   // 30 Oct a8: back-filled hops have no txid
const L = {}, attSec = {}; const landSec = new Set(); let landedWin = 0;
for (const l of fs.readFileSync(sub, "utf8").split("\n")) { if (!l) continue; const [ts, s, res, why, txid] = l.split(","); const t = Date.parse(ts); if (t < W0 || t >= W1) continue;
  const o = L[s] ??= { att: 0, ok: 0, cont: 0, noncont: 0, landed: 0 }; o.att++; (attSec[s] ??= new Set()).add(Math.floor((t - W0) / 1000));
  if (res === "ok") { o.ok++; const h = hops.get(txid); if (h) { o.landed++; } } else if (why === "already_spent" || why === "orphan") o.cont++; else o.noncont++; }   // result=error (pre_submit) counts as non-contention
let backfill = 0; for (const h of hops.values()) { if (h.source === "backfill") { backfill++; continue; } const t = Date.parse(h.accept_header_utc || h.seen_utc); if (t >= W0 && t < W1) { landedWin++; landSec.add(Math.floor((t - W0) / 1000)); } }
// 30 Oct dated change: the 15 % share rule is over desk, muon, boson only; mini (tunnel) is reported
// 30 Oct a7 (plan 2b): no lane has a share rule; every share is reported only. SHARE_LANES=desk restores the old rule for comparison.
const SHARE = (process.env.SHARE_LANES || "").split(",").filter(Boolean);
const all = Object.values(L).reduce((a, o) => a + o.landed, 0);
// 30 Oct a6: the share rule is checked on the UNROUNDED share (share_pass); share_rule is rounded for display only (a6: 14.973 % printed as 15)
// 30 Oct a5 (option a): with ONE share lane (desk) the rule is that lane's share of ALL landed hops (a share of itself would always be 100 %)
const tot = SHARE.length <= 1 ? all : Object.entries(L).filter(([k]) => SHARE.includes(k)).reduce((a, [, o]) => a + o.landed, 0);
const rows = Object.entries(L).map(([k, o]) => ({ lane: k, ...o, noncont_pct: +(100 * o.noncont / o.att).toFixed(2), landed_share_pct: +(100 * o.landed / all).toFixed(1), landed_share_exact_pct: +(100 * o.landed / all).toFixed(3), noncont_pass: 100 * o.noncont / o.att <= 1, every_second_pass: attSec[k].size >= N, share_rule: SHARE.includes(k) ? +(100 * o.landed / tot).toFixed(1) : "reported_only", share_exact_pct: SHARE.includes(k) ? +(100 * o.landed / tot).toFixed(3) : undefined, share_pass: SHARE.includes(k) ? 100 * o.landed / tot >= 15 : undefined, secs_attempting: attSec[k].size }));
console.log(JSON.stringify({ window_s: N, hops_landed_in_window: landedWin, hops_backfill: backfill, attributed: tot, land_secs: landSec.size, land_secs_pct: +(100 * landSec.size / N).toFixed(2), lanes: rows }, null, 1));
