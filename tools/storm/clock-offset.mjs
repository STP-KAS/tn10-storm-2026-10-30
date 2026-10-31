// clock-offset.mjs: measure this machine's clock offset vs NTP (SNTP over UDP 123), no admin, no system change.
//   node clock-offset.mjs [--server pool.ntp.org] [--samples 5] [--log <file.csv>]
// Prints the median offset in ms (positive = local clock behind). Senders log it at start so counts can be corrected.
import dgram from "node:dgram"; import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const server = arg("--server", "pool.ntp.org"); const samples = Number(arg("--samples", 5)); const logf = arg("--log");
const ntp = (buf, o) => (buf.readUInt32BE(o) - 2208988800) * 1000 + (buf.readUInt32BE(o + 4) * 1000) / 2 ** 32;
const once = () => new Promise((res, rej) => {
  const s = dgram.createSocket("udp4"); const q = Buffer.alloc(48); q[0] = 0x1b; const t1 = Date.now();
  const to = setTimeout(() => { s.close(); rej(new Error("timeout")); }, 3000);
  s.on("message", (m) => { const t4 = Date.now(); clearTimeout(to); s.close(); if (m.length < 48 || m[1] === 0 || m.readUInt32BE(40) === 0) return rej(new Error("kod_or_zero_ts")); const t2 = ntp(m, 32), t3 = ntp(m, 40); res({ off: ((t2 - t1) + (t3 - t4)) / 2, rtt: (t4 - t1) - (t3 - t2) }); });
  s.send(q, 123, server, (e) => e && rej(e));
});
// 31 Oct a9: a reply with stratum 0 (Kiss-o'-Death) or a zero transmit time gave offset_ms=-4002404878292.5 (clock-desk.csv 03:08:04Z, n=1): such replies are now dropped.
const r = []; for (let i = 0; i < samples; i++) { try { r.push(await once()); } catch {} }
if (!r.length) { console.error("CLOCK no_reply"); process.exit(2); }
r.sort((a, b) => a.off - b.off); const m = r[Math.floor(r.length / 2)];
const line = `${new Date().toISOString()},${server},${m.off.toFixed(1)},${m.rtt.toFixed(1)},${r.length}`;
console.log(`CLOCK offset_ms=${m.off.toFixed(1)} rtt_ms=${m.rtt.toFixed(1)} n=${r.length}`);
if (logf) { if (!fs.existsSync(logf)) fs.writeFileSync(logf, "utc,server,offset_ms,rtt_ms,samples\n"); fs.appendFileSync(logf, line + "\n"); }
