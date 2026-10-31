// mempool-ro.mjs <config> [url] [--extra <file of addresses, one per line>] [--wait 60] [--label desk] [--log <jsonl>]
// READ-ONLY mempool census (31 Oct a10, criterion 9 = 0 of OUR transactions left 10 min after END, stp 07:36 CET).
// "Ours" = a tx that pays to one of our lane keys (keys_file) or genesis keys (--extra addresses); our hops and funding always
// return change to our key, so every tx of ours has such an output. Snapshot, optional second snapshot after --wait s.
// Prints and logs counts only: no ids, keys or addresses.
import fs from "node:fs"; import { createRequire } from "node:module";
const require=createRequire(import.meta.url); const arg=(n,d)=>{const i=process.argv.indexOf("--"+n); return i>0?process.argv[i+1]:d;};
const pos=process.argv.slice(2).filter((a,i,A)=>!a.startsWith("--")&&!(i>0&&A[i-1].startsWith("--")));
const c=JSON.parse(fs.readFileSync(pos[0],"utf8").replace(/^\uFEFF/,""));
const k=require(c.kaspa_sdk); const r=new k.RpcClient({url:pos[1]||c.main_node_url,encoding:k.Encoding.Borsh,networkId:"testnet-10"}); await r.connect({timeoutDuration:15000});
const mine=new Set(fs.readFileSync(c.keys_file,"utf8").trim().split(/\r?\n/).map(h=>new k.PrivateKey(h.trim()).toKeypair().toAddress("testnet-10").toString()));
const ex=arg("extra"); if(ex&&fs.existsSync(ex)) for(const a of fs.readFileSync(ex,"utf8").split(/\s+/)) if(a) mine.add(a.trim());
const snap=async()=>{const m=await r.getMempoolEntries({includeOrphanPool:true,filterTransactionPool:false}); return m.mempoolEntries||m.entries||[];};
const isOurs=(e)=>{for(const o of e.transaction.outputs||[]){try{if(mine.has(k.addressFromScriptPublicKey(o.scriptPublicKey,"testnet-10")?.toString())) return true;}catch{}} return false;};
const idOf=(e)=>e.transaction.verboseData?.transactionId||e.transaction.id;
const st=(s)=>{let o=0,orph=0; for(const e of s){if(isOurs(e))o++; if(e.isOrphan)orph++;} return {n:s.length,ours:o,others:s.length-o,orphan:orph};};
const s1=await snap(); const W=Number(arg("wait","60")); let out={utc:new Date().toISOString(),label:arg("label",""),our_keys:mine.size,snap1:st(s1)};
if(W>0){const ids=new Set(s1.map(idOf)); await new Promise(z=>setTimeout(z,W*1000)); const s2=await snap(); out.snap2=st(s2); out.persisted=s2.filter(e=>ids.has(idOf(e))).length;}
// --save-pre <file>: store ids of our txs already in the mempool (pre-START, private run dir, never git); --pre <file>: report ours_new excluding them.
const ourIds=s1.filter(isOurs).map(idOf); if(arg("save-pre")) fs.writeFileSync(arg("save-pre"),ourIds.join("\n")+"\n");
if(arg("pre")&&fs.existsSync(arg("pre"))){const pre=new Set(fs.readFileSync(arg("pre"),"utf8").split(/\s+/).filter(Boolean)); out.ours_pre_start=ourIds.filter(i=>pre.has(i)).length; out.ours_new=ourIds.length-out.ours_pre_start;}
const line=JSON.stringify(out); console.log(line); if(arg("log")) fs.appendFileSync(arg("log"),line+"\n");
await r.disconnect(); process.exit(0);
