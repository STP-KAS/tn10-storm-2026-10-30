// handoff-push.mjs (mini): push handoff.json to the desk receiver and verify by sha256. Node built-ins only. TESTNET-10 ONLY.
//   node handoff-push.mjs --file <run_dir>\handoff.json --url http://<desk-lan>:18600/handoff --token-file <run_dir>\private\handoff.token
// URL and token stay in the local run folder (never committed). Retries for up to 50 s. Logs "HANDOFF ok" to phase.log.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const file = arg("--file"); const url = arg("--url", process.env.HANDOFF_URL); const token = fs.readFileSync(arg("--token-file"), "utf8").trim();
const phase = arg("--phase-log", path.join(path.dirname(file), "logs", "phase.log"));
const body = fs.readFileSync(file); const sha = crypto.createHash("sha256").update(body).digest("hex");
const t0 = Date.now(); const deadline = t0 + Number(arg("--timeout-ms", 50000)); let last = "";
const out = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); fs.mkdirSync(path.dirname(phase), { recursive: true }); fs.appendFileSync(phase, l + "\n"); };
while (Date.now() < deadline) {
  try {
    const r = await fetch(url, { method: "POST", body, headers: { "x-handoff-token": token, "x-sha256": sha, "content-type": "application/json" }, signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    if (r.ok && j.sha256 === sha) { out(`HANDOFF ok sha256=${sha} bytes=${body.length} ms=${Date.now() - t0}`); process.exit(0); }
    last = `http_${r.status}_${j.err || "?"}`; if (r.status === 403 || r.status === 422) break;
  } catch (e) { last = e.cause?.code || e.name; }
  await new Promise((s) => setTimeout(s, 2000));
}
out(`HANDOFF FAIL ${last} ms=${Date.now() - t0}`); process.exit(2);
