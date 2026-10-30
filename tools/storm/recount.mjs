// recount.mjs: after END, an independent hop count per family: walk each family from its genesis state to the tip on
// the given node (no shared state with the run). Writes logs/recount.csv. TESTNET-10 ONLY.
import fs from "node:fs";
import { CFG, P, connect, arg } from "./lib.mjs";
import { startBuilder, catchUp } from "./covenant.mjs";
const rpc = await connect(arg("node", CFG.main_node_url));
const B = startBuilder(P("private", "builder-recount.err")); await B.ask("ping", 120000);
const out = P("logs", "recount.csv"); if (!fs.existsSync(out)) fs.writeFileSync(out, "ts_utc,family,genesis_seq,tip_seq,hops\n");
for (const f of CFG.families) {
  const g = P("private", `genesis-state-${f.family}.json`); if (!fs.existsSync(g)) continue;
  const st = JSON.parse(fs.readFileSync(g, "utf8"));
  const tip = await catchUp(rpc, B, st, 1_000_000).catch(() => null);
  fs.appendFileSync(out, `${new Date().toISOString()},${f.family},${st.seq || 0},${tip ? tip.seq : ""},${tip ? tip.seq - (st.seq || 0) : ""}\n`);
}
// 30 Oct a8: tolerance check, hop log (coord + resync + backfill lines, last line per family+seq) vs recount; <= 0.5 % -> RECOUNT_MATCH
{ const tol = Number(arg("tol", "0.5")); const hl = P("private", "hops.jsonl"); const per = new Map(); let rc = 0;
  for (const l of (fs.existsSync(hl) ? fs.readFileSync(hl, "utf8") : "").split("\n")) { if (!l) continue; let h; try { h = JSON.parse(l); } catch { continue; } if (h.revert_of) continue; const k = h.family + ":" + (h.seq ?? h.txid); per.set(k, 1); }
  for (const l of fs.readFileSync(out, "utf8").trim().split("\n").slice(1)) { const c = l.split(","); if (c[4] !== "") rc += Number(c[4]); }
  const hlN = per.size, diff = rc ? 100 * Math.abs(hlN - rc) / rc : 100;
  const line = `${new Date().toISOString()} ${diff <= tol ? "RECOUNT_MATCH" : "RECOUNT_DIFF"} hoplog=${hlN} recount=${rc} diff_pct=${diff.toFixed(3)} tol_pct=${tol}`;
  console.log(line); fs.appendFileSync(P("logs", "recount-check.txt"), line + "\n"); }
try { await B.ask("quit", 3000); } catch {} await rpc.disconnect().catch(() => {}); process.exit(0);
