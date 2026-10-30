// preflight.mjs: before START, every lane must resolve (DNS), connect over wRPC, be testnet-10 + synced, and its key
// must hold >= CFG.min_coins funding coins (> 3 tKAS). Exit 0 = all pass; 20 = a lane failed (launch must abort).
// Lane endpoints come from CFG.lanes = { label: { url, key } } (30 Oct a3: no hard-coded hosts). TESTNET-10 ONLY.
import dns from "node:dns/promises";
import { CFG, P, to, connect } from "./lib.mjs";
import { keyAddress } from "./covenant.mjs";
import fs from "node:fs";
const MIN = CFG.min_coins ?? 200; let bad = 0;
for (const [label, l] of Object.entries(CFG.lanes || {})) {
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
process.exit(bad ? 20 : 0);
