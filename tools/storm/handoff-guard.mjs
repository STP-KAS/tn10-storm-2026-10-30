// handoff-guard.mjs (desk): refuse to start senders unless handoff.json is present, fresh and intact. TESTNET-10 ONLY.
//   node handoff-guard.mjs --dir <run_dir> --run-date 2026-10-30 [--families 4] [--allow-test]
// Checks: file exists; sha256 equals handoff.json.sha256; kind storm-handoff; created >= run date (UTC);
// family count matches; a file marked test:true is refused unless --allow-test. Exit 0 = OK, 10+ = refused.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const dir = arg("--dir", process.cwd()); const runDate = arg("--run-date"); const fams = arg("--families");
const f = path.join(dir, "handoff.json");
const no = (code, why) => { console.error(`GUARD REFUSE ${why}`); process.exit(code); };
if (!runDate) no(19, "no_run_date");
if (!fs.existsSync(f)) no(10, "missing");
if (!fs.existsSync(f + ".sha256")) no(11, "no_sha256");
const body = fs.readFileSync(f); const sha = crypto.createHash("sha256").update(body).digest("hex");
if (sha !== fs.readFileSync(f + ".sha256", "utf8").trim().toLowerCase()) no(12, "sha_mismatch");
let j; try { j = JSON.parse(body.toString("utf8").replace(/^\uFEFF/, "")); } catch { no(13, "bad_json"); }
if (j.kind !== "storm-handoff") no(13, "not_handoff");
const created = Date.parse(j.created || ""); if (!(created >= Date.parse(runDate + "T00:00:00Z"))) no(14, `stale created=${j.created || "none"}`);
const n = Object.keys(j.families || {}).length; if (fams && n !== Number(fams)) no(15, `families=${n} want=${fams}`);
if (j.test && !process.argv.includes("--allow-test")) no(16, "test_file");
console.log(`GUARD OK sha256=${sha} families=${n} created=${j.created}${j.test ? " TEST" : ""}`);
