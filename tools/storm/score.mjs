// score.mjs <sub.csv: ts,sender,result,reason,txid> <hops.jsonl> <from_utc> <to_utc>
// Scores a run against the 30 Oct criteria. Prints counts only (no txids). TESTNET-10 ONLY.
import fs from "node:fs";
const [sub, hopsF, from, to, censusF] = process.argv.slice(2);   // 31 Oct a10: optional 5th arg = mempool census jsonl(s), comma-separated
const W0 = Date.parse(from), W1 = Date.parse(to), N = (W1 - W0) / 1000;
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
// 31 Oct 2026 07:36 CET, stp: criterion 9 = 0 of OUR transactions (paying to our lane or genesis keys) in each node's mempool 10 min after END.
let crit9 = null; if (censusF) { const per = {}; for (const f of censusF.split(",")) for (const l of (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "").split("\n")) { if (!l) continue; const c = JSON.parse(l); if (Date.parse(c.utc) >= W1 + 600000) per[c.label] = c; }
  const nodes = Object.entries(per).map(([label, c]) => ({ label, utc: c.utc, ours: (c.snap2 ?? c.snap1).ours, total: (c.snap2 ?? c.snap1).n, ours_pre_start: c.ours_pre_start ?? null, ours_new: c.ours_new ?? null }));
  crit9 = { rule: "0 own tx at END+10 min", nodes, pass: nodes.length >= 2 && nodes.every((x) => x.ours === 0), pass_excl_pre_start: nodes.length >= 2 && nodes.every((x) => x.ours_new === 0) }; }
console.log(JSON.stringify({ crit9, window_s: N, hops_landed_in_window: landedWin, hops_backfill: backfill, attributed: tot, land_secs: landSec.size, land_secs_pct: +(100 * landSec.size / N).toFixed(2), lanes: rows }, null, 1));
