// handoff-receiver.mjs (desk): tiny HTTP receiver for the mini's handoff push. Node built-ins only. TESTNET-10 ONLY.
//   node handoff-receiver.mjs --dir <run_dir> [--port 18600]
// POST /handoff  headers: x-handoff-token (must equal <run_dir>/private/handoff.token), x-sha256 (hex of body)
// Verifies sha256, writes <run_dir>/handoff.json + handoff.json.sha256 atomically, replies {ok,sha256,bytes}.
// Never touches kaspad. Token file stays local (private/ is never committed).
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const dir = arg("--dir", process.cwd()); const port = Number(arg("--port", process.env.HANDOFF_PORT || 18600));
const token = fs.readFileSync(path.join(dir, "private", "handoff.token"), "utf8").trim();
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); fs.mkdirSync(path.join(dir, "logs"), { recursive: true }); fs.appendFileSync(path.join(dir, "logs", "handoff-receiver.log"), l + "\n"); };
const eq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
http.createServer((req, res) => {
  const send = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method === "GET" && req.url === "/health") return send(200, { ok: true });
  if (req.method !== "POST" || req.url !== "/handoff") return send(404, { ok: false });
  if (!eq(String(req.headers["x-handoff-token"] || ""), token)) { log("REJECT bad_token"); return send(403, { ok: false, err: "bad_token" }); }
  const chunks = []; let n = 0;
  req.on("data", (c) => { n += c.length; if (n > 1 << 20) req.destroy(); else chunks.push(c); });
  req.on("end", () => {
    const body = Buffer.concat(chunks); const sha = crypto.createHash("sha256").update(body).digest("hex");
    if (sha !== String(req.headers["x-sha256"] || "").toLowerCase()) { log(`REJECT sha_mismatch got=${sha}`); return send(422, { ok: false, err: "sha_mismatch", sha256: sha }); }
    try { const j = JSON.parse(body.toString("utf8")); if (j.kind !== "storm-handoff") throw new Error("kind"); } catch { log("REJECT not_handoff"); return send(422, { ok: false, err: "not_handoff" }); }
    const f = path.join(dir, "handoff.json");
    fs.writeFileSync(f + ".tmp", body); fs.renameSync(f + ".tmp", f); fs.writeFileSync(f + ".sha256", sha + "\n");
    log(`HANDOFF received bytes=${body.length} sha256=${sha}`); send(200, { ok: true, sha256: sha, bytes: body.length });
  });
}).listen(port, () => log(`listening port=${port} dir=${dir}`));
