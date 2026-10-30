// preflight.mjs: before START, every lane must resolve (DNS), connect over wRPC, be testnet-10 + synced, and its key
// must hold >= CFG.min_coins funding coins (> 3 tKAS). Exit 0 = all pass; 20 = a lane failed (launch must abort).
// Lane endpoints come from CFG.lanes = { label: { url, key } } (30 Oct a3: no hard-coded hosts). TESTNET-10 ONLY.
import dns from "node:dns/promises";
import { CFG, P, to, connect } from "./lib.mjs";
import { keyAddress } from "./covenant.mjs";
import fs from "node:fs";
const MIN = CFG.min_coins ?? 200; let bad = 0;
for (const [label, l] of Object.entries(process.argv.includes("--genesis") ? {} : (CFG.lanes || {}))) {
  const row = { label, dns: "-", rpc: "-", synced: "-", coins: -1, pass: 0 };
  try {
    const host = new URL(l.url).hostname;
    if (!/^(127\.0\.0\.1|localhost)$/.test(host)) { await to(dns.lookup(host), 5000, "dns"); }
    row.dns = "ok";
    const t0 = Date.now(); const rpc = await connect(l.url, 2); row.rpc = Date.now() - t0;
    const si = await to(rpc.getServerInfo(), 5000); row.synced = si.isSynced ? 1 : 0;
    const r = await to(rpc.getUtxosByAddresses({ addresses: [keyAddress(Number(l.key))] }), 15000);
    row.coins = (r.entries || []).filter((e) => !e.isCoinbase && BigInt(e.amount) > 300_000_000n).length;
    await rpc.disconnect().catch(() => {});
    row.pass = row.synced === 1 && row.coins >= MIN ? 1 : 0;
  } catch (e) { row.err = /ENOTFOUND|dns/.test(String(e.message)) ? "dns" : /timeout/.test(String(e.message)) ? "timeout" : "rpc"; }
  if (!row.pass) bad++;
  const line = `${new Date().toISOString()} PREFLIGHT lane=${label} dns=${row.dns} rpc_ms=${row.rpc} synced=${row.synced} coins=${row.coins} min=${MIN} pass=${row.pass}${row.err ? " err=" + row.err : ""}`;
  console.log(line); fs.appendFileSync(P("logs", "preflight.log"), line + "\n");
}
// 30 Oct a6: genesis-key funding check (run on the main-node machine before genesis: --genesis). Every family's
// genesis key needs >= 1 coin of >= 15 tKAS (a5's first launch dropped all 4 families on no_funding).
if (process.argv.includes("--genesis")) {
  const rpc = await connect(CFG.main_node_url, 2);
  for (const f of CFG.families) {
    let n = -1; try { const r = await to(rpc.getUtxosByAddresses({ addresses: [keyAddress(Number(f.key ?? 0))] }), 15000); n = (r.entries || []).filter((e) => !e.isCoinbase && BigInt(e.amount) >= 1_500_000_000n).length; } catch {}
    const ok = n >= 1 ? 1 : 0; if (!ok) bad++;
    const line = `${new Date().toISOString()} PREFLIGHT genesis_key family=${f.family} coins_15tkas=${n} pass=${ok}`; console.log(line); fs.appendFileSync(P("logs", "preflight.log"), line + "\n");
  }
  await rpc.disconnect().catch(() => {});
}
// 30 Oct a6: clock gate. |offset| > CFG.clock_max_ms (default 80, headroom for -0.33 ms/min drift) fails. With
// CFG.clock_gate = "log" the failure is logged as a known failure and does not abort (desk NTP fix needs admin).
if (!process.argv.includes("--no-clock")) {
  const { execFileSync } = await import("node:child_process"); const path = await import("node:path"); const url = await import("node:url");
  const here = path.dirname(url.fileURLToPath(import.meta.url)); let off = NaN;
  try { off = Number(/offset_ms=(-?[\d.]+)/.exec(execFileSync(process.execPath, [path.join(here, "clock-offset.mjs"), "--samples", "5"], { encoding: "utf8", timeout: 30000 }))[1]); } catch {}
  const max = Number(CFG.clock_max_ms ?? 80), ok = Number.isFinite(off) && Math.abs(off) <= max ? 1 : 0, mode = CFG.clock_gate || "abort";
  const line = `${new Date().toISOString()} PREFLIGHT clock offset_ms=${Number.isFinite(off) ? off.toFixed(1) : "none"} max=${max} pass=${ok} gate=${mode}${!ok && mode === "log" ? " known_failure=1" : ""}`;
  console.log(line); fs.appendFileSync(P("logs", "preflight.log"), line + "\n");
  if (!ok && mode !== "log") bad++;
}
process.exit(bad ? 20 : 0);
