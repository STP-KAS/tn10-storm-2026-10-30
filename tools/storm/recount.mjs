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
try { await B.ask("quit", 3000); } catch {} await rpc.disconnect().catch(() => {}); process.exit(0);
