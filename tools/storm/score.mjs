// score.mjs <sub.csv: ts,sender,result,reason,txid> <hops.jsonl> <from_utc> <to_utc>
// Scores a run against the 30 Oct criteria. Prints counts only (no txids). TESTNET-10 ONLY.
import fs from "node:fs";
const [sub, hopsF, from, to] = process.argv.slice(2); const W0 = Date.parse(from), W1 = Date.parse(to), N = (W1 - W0) / 1000;
const hops = new Map(); for (const l of fs.readFileSync(hopsF, "utf8").split("\n")) if (l) { const h = JSON.parse(l); hops.set(h.txid, h); }
const L = {}, attSec = {}; const landSec = new Set(); let landedWin = 0;
for (const l of fs.readFileSync(sub, "utf8").split("\n")) { if (!l) continue; const [ts, s, res, why, txid] = l.split(","); const t = Date.parse(ts); if (t < W0 || t >= W1) continue;
  const o = L[s] ??= { att: 0, ok: 0, cont: 0, noncont: 0, landed: 0 }; o.att++; (attSec[s] ??= new Set()).add(Math.floor((t - W0) / 1000));
  if (res === "ok") { o.ok++; const h = hops.get(txid); if (h) { o.landed++; } } else if (why === "already_spent" || why === "orphan") o.cont++; else o.noncont++; }   // result=error (pre_submit) counts as non-contention
for (const h of hops.values()) { const t = Date.parse(h.accept_header_utc || h.seen_utc); if (t >= W0 && t < W1) { landedWin++; landSec.add(Math.floor((t - W0) / 1000)); } }
// 30 Oct dated change: the 15 % share rule is over desk, muon, boson only; mini (tunnel) is reported
const SHARE = (process.env.SHARE_LANES || "desk,muon,boson").split(",");
const all = Object.values(L).reduce((a, o) => a + o.landed, 0);
// 30 Oct a5 (option a): with ONE share lane (desk) the rule is that lane's share of ALL landed hops (a share of itself would always be 100 %)
const tot = SHARE.length === 1 ? all : Object.entries(L).filter(([k]) => SHARE.includes(k)).reduce((a, [, o]) => a + o.landed, 0);
const rows = Object.entries(L).map(([k, o]) => ({ lane: k, ...o, noncont_pct: +(100 * o.noncont / o.att).toFixed(2), landed_share_pct: +(100 * o.landed / all).toFixed(1), share_rule: SHARE.includes(k) ? +(100 * o.landed / tot).toFixed(1) : "reported_only", secs_attempting: attSec[k].size }));
console.log(JSON.stringify({ window_s: N, hops_landed_in_window: landedWin, attributed: tot, land_secs: landSec.size, land_secs_pct: +(100 * landSec.size / N).toFixed(2), lanes: rows }, null, 1));
