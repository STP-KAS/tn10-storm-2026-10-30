// sender.mjs --label <tag> --node <wrpc-url> [--source self|coord]
// Real covenant hop via `kcc20 storm`. Token bucket per family at the step rate. Logs every attempt.
// source=coord (default): spends the outpoint the coordinator published in state/.
// source=self: discovers the next outpoint from this sender's own node (public-node senders on the box).
// TESTNET-10 ONLY. Never prints a key.
import fs from "node:fs";
// 30 Oct a5: every stderr line carries an ISO timestamp, so post-END lines are visibly after END
for (const k of ["error", "warn"]) { const o = console[k].bind(console); console[k] = (...a) => o(new Date().toISOString(), ...a); }
process.on("uncaughtException", (e) => { console.error("uncaught", e?.stack || e); process.exit(1); });
process.on("unhandledRejection", (e) => console.error("unhandled", String(e?.message || e)));
import { CFG, P, phase, iso, sleep, to, stepAt, END, STOPF, reason, connect, readState, writeState, arg } from "./lib.mjs";
import { startBuilder, buildHop, catchUp, Pool, keyAddress } from "./covenant.mjs";
const CATCHUP_MS = Number(CFG.catchup_ms || 2000);   // 30 Oct a5: catch-up cap

const LABEL = arg("label"), URL = arg("node"), SOURCE = arg("source", "coord");
if (!LABEL || !URL) { console.error("usage: --label <tag> --node <url> [--source self|coord]"); process.exit(5); }
const KEY = Number(arg("key", CFG.sender_key ?? 0));
const LOG = fs.createWriteStream(P("private", `submit-${LABEL}.jsonl`), { flags: "a" });
const CLOG = fs.createWriteStream(P("private", `catchup-${LABEL}.jsonl`), { flags: "a" });   // 30 Oct a5: catch-up timeouts/errors, kept out of the submit log
const rpc = await connect(URL);
const B = startBuilder(P("private", `builder-${LABEL}.err`));
await B.ask("ping", 120000);
const addr = keyAddress(KEY);
const pool = new Pool(rpc, addr); await pool.refresh();
const nFam = CFG.families.length;
let alive = true, skipped = false, dropped = false, daa = 0n, daaAt = Date.now(), nonce = 1, shapeRej = 0, shapeTry = 0;

let fails = 0;   // 30 Oct a3: node_dead only after 3 failed probes in a row (muon flapped for 11 s)
async function health() {
  let bad = "";
  try {
    const [si, dag, info] = await Promise.all([to(rpc.getServerInfo(), 5000), to(rpc.getBlockDagInfo(), 5000), to(rpc.getInfo(), 5000)]);
    const d = BigInt(dag.virtualDaaScore); if (d !== daa) { daa = d; daaAt = Date.now(); }
    if (!si.isSynced) bad = "not_synced"; else if (Date.now() - daaAt > 30000) bad = "daa_still";
    if (!skipped && Number(info.mempoolSize) >= 90000) { skipped = true; phase(`NODE_SKIP node=${LABEL} reason=mempool_90k`); }
  } catch { bad = "rpc"; }
  if (bad) fails++; else fails = 0;
  if (bad && fails < 3) bad = "";
  if (bad && alive) { alive = false; phase(`SENDER_OFF sender=${LABEL} reason=node_dead`); }
  else if (!bad && !alive && !fs.existsSync(P("control", `HOLD-${LABEL}`))) { alive = true; phase(`SENDER_ON sender=${LABEL}`); }
  if (Date.now() - pool.at > 5000) pool.refresh().catch(() => {});
}
setInterval(() => health().catch(() => {}), 2000);
let cpu0 = process.cpuUsage(), cpuT = Date.now();
setInterval(() => { try { const c = process.cpuUsage(cpu0), dt = Date.now() - cpuT; cpu0 = process.cpuUsage(); cpuT = Date.now(); fs.appendFileSync(P("logs", `proc-${LABEL}.csv`), `${iso()},${(((c.user + c.system) / 1000) / dt * 100).toFixed(1)},${(process.memoryUsage().rss / 1048576).toFixed(0)},${inflight},${B.depth ? B.depth() : 0},${catchups},${catchupTimeouts}\n`); } catch {} }, 5000);   // 30 Oct a5: cpu%, rss MB, in-flight attempts, builder queue, catch-ups
setInterval(() => { try { fs.appendFileSync(P("logs", `pool-${LABEL}.csv`), `${iso()},${pool.coins.length}\n`); } catch {} }, 5000);   // pool size per lane

// 30 Oct a5: one catch-up at a time per family (single-flight), capped at CATCHUP_MS. Attempts keep using the cached
// tip while a catch-up runs (they still count as attempts and lose as contention), never pile up behind it.
// On a reject the tip is marked stale; the refresh starts from the NEWEST of our cache and the shared state file
// (another lane may have seen the tip move), so an orphan never sends us on a long walk from an old state.
const fam$ = new Map();   // family -> { st, stale, inflight, catchup_ms }
let inflight = 0, catchups = 0, catchupTimeouts = 0;
function newest(a, b) { if (!a) return b; if (!b) return a; return (b.seq || 0) > (a.seq || 0) ? b : a; }
function refresh(fam) {
  const f = fam$.get(fam) || { st: null, stale: true, inflight: null, catchup_ms: 0 }; fam$.set(fam, f);
  if (f.inflight) return f.inflight;
  const from = newest(f.st, readState(fam)); if (!from || !from.covenantId) return null;
  const t0 = Date.now(); catchups++;
  f.inflight = to(catchUp(rpc, B, from, 100000, t0 + CATCHUP_MS), CATCHUP_MS + 500, "catchup")
    .then((st) => { f.st = st; f.stale = false; f.catchup_ms = Date.now() - t0; if ((st.seq || 0) > ((from.seq || 0))) writeState(fam, { ...st, source: "self" }); })
    .catch((e) => { catchupTimeouts++; f.catchup_ms = Date.now() - t0; if (!f.st) f.st = from; f.stale = true; CLOG.write(JSON.stringify({ ts: iso(), sender: LABEL, node: LABEL, family: fam, txid: "", result: "catchup", reason: /timeout|deadline/.test(String(e?.message)) ? "catchup_timeout" : "catchup_error", catchup_ms: f.catchup_ms, err: String(e?.message || e).replace(/[0-9a-f]{64}/g, "<h>").slice(0, 200) }) + "\n"); })
    .finally(() => { f.inflight = null; });
  return f.inflight;
}
async function current(fam) {
  if (SOURCE !== "self") return readState(fam);
  const f = fam$.get(fam);
  if (!f || !f.st) { await refresh(fam); return fam$.get(fam)?.st || null; }
  if (f.stale) refresh(fam);   // do not wait: use the cached tip meanwhile
  return f.st;
}
function markStale(fam, why) { const f = fam$.get(fam); if (!f) return; f.stale = true; if (why === "orphan") { const sh = readState(fam); if (sh && f.st && (sh.seq || 0) > (f.st.seq || 0)) f.st = sh; } }

async function attempt(fam) {
  inflight++; try { return await attempt1(fam); } finally { inflight--; }
}
async function attempt1(fam) {
  const st = await current(fam); if (!st || !st.covenantId) return;
  const coin = pool.pick(fam, nFam); if (!coin) { if (Date.now() - pool.at > 1000) { pool.at = Date.now(); pool.refresh().catch(() => {}); } return; }  // 30 Oct a2: empty pool left 4 s gaps
  const tb = Date.now(); let h; try { h = await buildHop(B, st, coin, KEY, nonce++); } catch (e) { LOG.write(JSON.stringify({ ts: iso(), sender: LABEL, node: LABEL, family: fam, txid: "", result: "rejected", reason: "other", err: String(e.message || e).slice(0, 400) }) + "\n"); markStale(fam, "build"); return; }
  const build_ms = Date.now() - tb;
  if (h.compute > 100000) return;
  const ts = iso(); let result = "ok", why = "", err = ""; const t0 = Date.now();
  try { await to(rpc.submitTransaction({ transaction: h.tx, allowOrphan: false }), 8000, "submit"); }
  catch (e) { result = "rejected"; why = reason(e); err = String(e?.message || e).replace(/\s+/g, " ").slice(0, 600); }
  const row = { ts, sender: LABEL, node: LABEL, family: fam, txid: h.txid, result, reason: why, source: SOURCE, rpc_ms: Date.now() - t0, build_ms, tip_seq: st.seq || 0, catchup_ms: fam$.get(fam)?.catchup_ms ?? 0, q: inflight, bq: B.depth ? B.depth() : 0 }; if (err) row.err = err;
  LOG.write(JSON.stringify(row) + "\n");
  if (++shapeTry <= 20 && (why === "mass" || why === "fee")) { if (++shapeRej >= 5 && !dropped) { dropped = true; phase(`NODE_DROP node=${LABEL} reason=redeem_shape`); } }
  if (SOURCE === "self" && result !== "ok") markStale(fam, why); // tip moved: single-flight refresh, attempts continue on the cached tip
  // spent funding coin: drop it from the pool until the next refresh (change will appear)
  pool.coins = pool.coins.filter((c) => !(c.txid === coin.txid && c.index === coin.index));
}

const bucket = new Map(); let last = Date.now();
while (true) {
  const now = Date.now();
  if (now >= END || fs.existsSync(STOPF)) break;
  const s = stepAt(now); const dt = (now - last) / 1000; last = now;
  const on = s && s.step !== "gap" && alive && !skipped && !dropped;
  for (const f of CFG.families) {
    const fam = f.family;
    if (!on || fam > s.families) { bucket.set(fam, 0); continue; }
    let b = Math.min((bucket.get(fam) || 0) + s.rate * dt, Math.max(1, s.rate * 0.2));
    while (b >= 1) { b -= 1; attempt(fam).catch((e) => { console.error("attempt", e.message); LOG.write(JSON.stringify({ ts: iso(), sender: LABEL, node: LABEL, family: fam, txid: "", result: "error", reason: "pre_submit", err: String(e?.message || e).replace(/[0-9a-f]{64}/g, "<h>").slice(0, 200) }) + "\n"); }); }   // 30 Oct a3: count pre-submit errors
    bucket.set(fam, b);
  }
  await sleep(20);
}
await sleep(3000); LOG.end(); try { await B.ask("quit", 3000); } catch {} await rpc.disconnect().catch(() => {}); process.exit(0);
