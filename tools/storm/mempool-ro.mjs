// mempool-ro.mjs <config> [url]: READ-ONLY mempool census. Two snapshots 60 s apart: count, orphan, fee, ours (spends/pays our lane+genesis keys) vs others, persistent ids. Prints no ids, keys or addresses.
import fs from "node:fs"; import { createRequire } from "node:module";
const require=createRequire(import.meta.url); const c=JSON.parse(fs.readFileSync(process.argv[2],"utf8").replace(/^\uFEFF/,""));
const k=require(c.kaspa_sdk); const r=new k.RpcClient({url:process.argv[3]||c.main_node_url,encoding:k.Encoding.Borsh,networkId:"testnet-10"}); await r.connect({timeoutDuration:15000});
const mine=new Set(fs.readFileSync(c.keys_file,"utf8").trim().split(/\r?\n/).map(h=>new k.PrivateKey(h.trim()).toKeypair().toAddress("testnet-10").toString()));
const snap=async()=>{const m=await r.getMempoolEntries({includeOrphanPool:true,filterTransactionPool:false}); return m.mempoolEntries||m.entries||[];};
const cls=(e)=>{const t=e.transaction; let ours=false; for(const o of t.outputs||[]){try{const a=k.addressFromScriptPublicKey(o.scriptPublicKey,"testnet-10")?.toString(); if(mine.has(a)) ours=true;}catch{}} return ours;};
const s1=await snap(); const ids1=new Set(s1.map(e=>e.transaction.verboseData?.transactionId||e.transaction.id));
await new Promise(z=>setTimeout(z,60000)); const s2=await snap();
const st=(s)=>{let o=0,orph=0,fee=0n,ins=0,outs=0; for(const e of s){if(cls(e))o++; if(e.isOrphan)orph++; fee+=BigInt(e.fee||0); ins+=(e.transaction.inputs||[]).length; outs+=(e.transaction.outputs||[]).length;} return {n:s.length,ours:o,others:s.length-o,orphan:orph,avg_fee_sompi:s.length?Number(fee/BigInt(s.length)):0,avg_in:+(ins/(s.length||1)).toFixed(1),avg_out:+(outs/(s.length||1)).toFixed(1)};};
const persist=s2.filter(e=>ids1.has(e.transaction.verboseData?.transactionId||e.transaction.id)).length;
const si=await r.getServerInfo();
console.log(JSON.stringify({utc:new Date().toISOString(),synced:si.isSynced,snap1:st(s1),snap2:st(s2),persisted_60s:persist}));
await r.disconnect(); process.exit(0);
