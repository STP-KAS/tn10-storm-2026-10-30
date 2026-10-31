// mass-estimate.mjs <path to kaspa.js (nodejs SDK)>: KIP-9 storage mass of one storm hop shape, token output 0.2 vs 1 tKAS.
// Offline, no node, no keys. Hop: in minter 10 + funding 16 tKAS -> out minter 10, token T, change 16 - T - 0.05.
import { pathToFileURL } from "node:url";
const kaspa = await import(pathToFileURL(process.argv[2]).href);
const S = 1e8;
for (const tok of [0.2, 1]) {
  const ins = [10 * S, 16 * S], outs = [10 * S, tok * S, (16 - tok - 0.05) * S].map(Math.round);
  console.log(JSON.stringify({ token_tkas: tok, sdk_storage_mass: String(kaspa.calculateStorageMass("testnet-10", ins, outs)) }));
}
