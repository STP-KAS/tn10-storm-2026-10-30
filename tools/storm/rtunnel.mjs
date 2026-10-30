// rtunnel.mjs: reverse TCP tunnel so desk senders can reach the mini's localhost-only kaspad wRPC without changing
// kaspad or the mini's (Public-profile) firewall. The mini dials OUT to the desk; the desk pairs local clients with
// idle mini legs. Plain byte pipe; TESTNET-10 traffic only. No admin needed.
//  desk: node rtunnel.mjs desk --leg-port 18698 --local 127.0.0.1:17299
//  mini: node rtunnel.mjs mini --desk <desk-lan-ip>:18698 --target 127.0.0.1:17210 [--idle 6]
import net from "node:net";
const a = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const role = process.argv[2], log = (...x) => console.log(new Date().toISOString(), ...x);
if (role === "desk") {
  const idle = [], waiting = [];
  const pair = () => { while (idle.length && waiting.length) { const l = idle.shift(), c = waiting.shift(); if (l.destroyed || c.destroyed) { if (!c.destroyed) waiting.unshift(c); continue; } c.pipe(l); l.pipe(c); const k = () => { l.destroy(); c.destroy(); }; l.on("close", k); c.on("close", k); } };
  net.createServer((l) => { l.setKeepAlive(true, 10000); l.on("error", () => {}); l.on("close", () => { const i = idle.indexOf(l); if (i >= 0) idle.splice(i, 1); }); idle.push(l); pair(); }).listen(+a("leg-port", 18698), "0.0.0.0", () => log("legs listening"));
  const [h, p] = a("local", "127.0.0.1:17299").split(":");
  net.createServer((c) => { c.on("error", () => {}); waiting.push(c); pair(); setTimeout(() => { const i = waiting.indexOf(c); if (i >= 0) { waiting.splice(i, 1); c.destroy(); log("no leg"); } }, 10000); }).listen(+p, h, () => log("local listening"));
  setInterval(() => log("idle legs", idle.length), 60000);
} else {
  const [dh, dp] = a("desk").split(":"), [th, tp] = a("target", "127.0.0.1:17210").split(":"), N = +a("idle", 6);
  let open = 0;
  const leg = () => { open++; const l = net.connect(+dp, dh); let used = false; l.setKeepAlive(true, 10000);
    l.on("data", function first(d) { if (used) return; used = true; open--; l.pause(); l.removeListener("data", first); const t = net.connect(+tp, th, () => { t.write(d); l.pipe(t); t.pipe(l); l.resume(); }); const k = () => { l.destroy(); t.destroy(); }; t.on("error", k); t.on("close", k); l.on("close", k); fill(); });
    l.on("error", () => {}); l.on("close", () => { if (!used) { open--; setTimeout(fill, 1000); } }); };
  const fill = () => { while (open < N) leg(); };
  fill(); setInterval(fill, 5000);
}
