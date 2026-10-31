// sweep-ours.mjs <config> <url> [<url> ...] [--extra <genesis addrs file>] [--apply] [--fee-tkas 0.06] [--label <tag>] [--log <jsonl>]
// 31 Oct a10 (criterion 9). TESTNET-10 ONLY. Never prints keys, addresses or ids (counts only). Never touches kaspad.
// Problem: a hop that loses the race can be admitted to a node's mempool in the same instant the winning hop's block arrives;
// the node then keeps the loser although its minter input is spent (a10: 8 on desk, 14 on mini at END+10 min). The loser
// can never be mined, and an RPC-submitted tx does not expire, so it sits there for hours (a9 leftovers > 4 h).
// Fix: the loser's OTHER input, our lane funding coin, is still unspent. Replace each stuck tx with a 1-in/1-out self-transfer
// of that coin back to the same lane key (submitTransactionReplacement, higher fee rate). That evicts the loser, and the
// self-transfer itself is mined normally (no covenant, storage mass ~0). Dry run without --apply.
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url); const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const pos = process.argv.slice(2).filter((a, i, A) => !a.startsWith("--") && !(i > 0 && A[i - 1].startsWith("--") && !["--apply"].includes(A[i - 1])));
const c = JSON.parse(fs.readFileSync(pos[0], "utf8").replace(/^\uFEFF/, "")); const k = require(c.kaspa_sdk); const NET = "testnet-10";
const APPLY = process.argv.includes("--apply"); const FEE = BigInt(Math.round(Number(arg("fee-tkas", "0.06")) * 1e8));
const hex = fs.readFileSync(c.keys_file, "utf8").trim().split(/\r?\n/).map((h) => h.trim()).filter(Boolean);
const priv = hex.map((h) => new k.PrivateKey(h)); const addrs = priv.map((p) => p.toKeypair().toAddress(NET).toString());
const mine = new Set(addrs); const ex = arg("extra"); if (ex && fs.existsSync(ex)) for (const a of fs.readFileSync(ex, "utf8").split(/\s+/)) if (a) mine.add(a.trim());
const isOurs = (e) => (e.transaction.outputs || []).some((o) => { try { return mine.has(k.addressFromScriptPublicKey(o.scriptPublicKey, NET)?.toString()); } catch { return false; } });
const out = { utc: new Date().toISOString(), label: arg("label", ""), apply: APPLY, nodes: [] };
for (const url of pos.slice(1)) {
  const r = new k.RpcClient({ url, encoding: k.Encoding.Borsh, networkId: NET }); const n = { node: url.includes("127.0.0.1:17210") ? "desk" : url.includes("127.0.0.1:17299") ? "mini" : "other" };
  try {
    await r.connect({ timeoutDuration: 15000 });
    const m = await r.getMempoolEntries({ includeOrphanPool: false, filterTransactionPool: false }); const es = (m.mempoolEntries || m.entries || []).filter(isOurs);
    const u = await r.getUtxosByAddresses({ addresses: addrs }); const live = new Map();
    for (const e of u.entries || []) live.set(String(e.outpoint.transactionId) + ":" + e.outpoint.index, e);
    Object.assign(n, { ours: es.length, sweepable: 0, replaced: 0, failed: 0, no_live_input: 0, errors: {} });
    for (const e of es) {
      const ins = (e.transaction.inputs || []).map((i) => live.get(String(i.previousOutpoint.transactionId) + ":" + i.previousOutpoint.index)).filter(Boolean);
      if (!ins.length) { n.no_live_input++; continue; }
      n.sweepable++; if (!APPLY) continue;
      const coin = ins[0]; const a = coin.address?.toString?.() || String(coin.address); const ki = addrs.indexOf(a);
      if (ki < 0 || BigInt(coin.amount) <= FEE + 100_000_000n) { n.failed++; n.errors.skip = (n.errors.skip || 0) + 1; continue; }
      try {
        const tx = k.createTransaction([coin], [new k.PaymentOutput(new k.Address(a), BigInt(coin.amount) - FEE)], 0n, undefined, 1);
        const signed = k.signTransaction(tx, [priv[ki]], true);
        await r.submitTransactionReplacement({ transaction: signed }); n.replaced++;
      } catch (err) { n.failed++; const msg = String(err?.message || err).replace(/[0-9a-f]{64}/g, "<h>").replace(/kaspatest:\w+/g, "<a>").slice(0, 80); n.errors[msg] = (n.errors[msg] || 0) + 1; }
    }
    if (APPLY) { await new Promise((z) => setTimeout(z, 3000)); const m2 = await r.getMempoolEntries({ includeOrphanPool: true, filterTransactionPool: false }); n.ours_after_3s = (m2.mempoolEntries || m2.entries || []).filter(isOurs).length; }
    await r.disconnect();
  } catch (err) { n.error = String(err?.message || err).slice(0, 80); }
  out.nodes.push(n);
}
const line = JSON.stringify(out); console.log(line); if (arg("log")) fs.appendFileSync(arg("log"), line + "\n"); process.exit(0);
