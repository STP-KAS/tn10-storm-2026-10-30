// post-end.mjs --sdk <kaspa.js> --url <wrpc> --label <node> --out <logs dir> --end <utc> [--minutes 20]
// From END for N minutes, every 5 s: mempool + rpc time -> post-end-mempool-<label>.csv; first row at mempool <= 5 ->
// node-recovery-<label>.csv. Read-only. TESTNET-10 ONLY.
import fs from "node:fs"; import { createRequire } from "node:module";
const a = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const kaspa = createRequire(import.meta.url)(a("sdk")); const L = a("label"), O = a("out");
const END = Date.parse(a("end")), STOP = END + Number(a("minutes", "20")) * 60000;
const f = `${O}/post-end-mempool-${L}.csv`, r = `${O}/node-recovery-${L}.csv`;
if (!fs.existsSync(f)) fs.writeFileSync(f, "ts_utc,label,s_after_end,mempool,rpc_ms,synced,daa,err\n");
while (Date.now() < END) await new Promise((x) => setTimeout(x, 500));
const c = new kaspa.RpcClient({ url: a("url"), encoding: kaspa.Encoding.Borsh, networkId: "testnet-10" });
let rec = false;
while (Date.now() < STOP) {
  const t = Date.now(); let row;
  try { if (!c.isConnected) await c.connect({ timeoutDuration: 5000, blockAsyncConnect: true });
    const [i, d] = await Promise.all([c.getInfo(), c.getBlockDagInfo()]);
    row = [new Date(t).toISOString(), L, Math.round((t - END) / 1000), i.mempoolSize, Date.now() - t, i.isSynced ? 1 : 0, d.virtualDaaScore, ""];
    if (!rec && Number(i.mempoolSize) <= 5) { rec = true; fs.writeFileSync(r, "ts_utc,label,s_after_end,mempool,pass\n" + [row[0], L, row[2], row[3], row[2] <= 600 ? 1 : 0].join(",") + "\n"); }
  } catch (e) { row = [new Date(t).toISOString(), L, Math.round((t - END) / 1000), "", "", "", "", String(e.message || e).replace(/[,\s]+/g, " ").slice(0, 80)]; }
  fs.appendFileSync(f, row.join(",") + "\n");
  await new Promise((x) => setTimeout(x, Math.max(0, 5000 - (Date.now() - t))));
}
if (!rec) fs.writeFileSync(r, "ts_utc,label,s_after_end,mempool,pass\n,"+L+",,,0\n");
process.exit(0);
