// plant.mjs <state/family-N.json>: a6 rehearsal only. Overwrites a family's shared state with a tip ONE HOP AHEAD
// (seq + 1, random txid, random script) that does not exist on the chain, to prove the senders step back. TESTNET-10 ONLY.
import fs from 'node:fs'; import crypto from 'node:crypto';
const f = process.argv[2]; const j = JSON.parse(fs.readFileSync(f,'utf8'));
const p = { ...j, seq: (j.seq||0)+1, txid: crypto.randomBytes(32).toString('hex'), index: 0, remaining: j.remaining-1, spk: 'aa20'+crypto.randomBytes(32).toString('hex')+'87', nextSpk: undefined, live_utc: undefined, source: 'planted' };
fs.writeFileSync(f, JSON.stringify(p)); console.log(new Date().toISOString()+' PLANT from_seq='+j.seq+' planted_seq='+p.seq);
