// mempool-diag.mjs <config> <url> --extra <genesis addrs> --pre <file> --subdir <dir with submit-*.jsonl>  READ-ONLY. TESTNET-10 ONLY.
// Shape of OUR mempool txs: inputs, outputs (tKAS, key index / genesis / covenant), mass, fee, and which lane/family/seq submitted it.
// Prints no ids, keys or addresses.
import fs from "node:fs"; import readline from "node:readline"; import { createRequire } from "node:module";
const require=createRequire(import.meta.url); const arg=(n,d)=>{const i=process.argv.indexOf("--"+n); return i>0?process.argv[i+1]:d;};
const [cfgF,url]=process.argv.slice(2);
const c=JSON.parse(fs.readFileSync(cfgF,"utf8").replace(/^\uFEFF/,"")); const k=require(c.kaspa_sdk);
const r=new k.RpcClient({url,encoding:k.Encoding.Borsh,networkId:"testnet-10"}); await r.connect({timeoutDuration:15000});
const keys=fs.readFileSync(c.keys_file,"utf8").trim().split(/\r?\n/).map(h=>new k.PrivateKey(h.trim()).toKeypair().toAddress("testnet-10").toString());
const gen=new Set(fs.readFileSync(arg("extra"),"utf8").split(/\s+/).filter(Boolean));
const pre=new Set(arg("pre")&&fs.existsSync(arg("pre"))?fs.readFileSync(arg("pre"),"utf8").split(/\s+/).filter(Boolean):[]);
const m=await r.getMempoolEntries({includeOrphanPool:true,filterTransactionPool:false}); const es=m.mempoolEntries||m.entries||[];
const who=(o)=>{try{const a=k.addressFromScriptPublicKey(o.scriptPublicKey,"testnet-10")?.toString(); const i=keys.indexOf(a); if(i>=0) return "key"+i; if(gen.has(a)) return "genesis"; return a&&a.startsWith("kaspatest:p")?"p2sh":"other";}catch{return "?";}};
const idOf=(e)=>e.transaction.verboseData?.transactionId||e.transaction.id;
const ours=es.filter(e=>(e.transaction.outputs||[]).some(o=>{const w=who(o);return w.startsWith("key")||w==="genesis";}));
const ids=new Map(ours.map(e=>[idOf(e),null]));
// also index our txs' input prev ids to find parents in submit logs
const sub=arg("subdir"); if(sub) for(const f of fs.readdirSync(sub).filter(f=>/^submit-.*\.jsonl$/.test(f))){
  const rl=readline.createInterface({input:fs.createReadStream(sub+"/"+f)}); for await (const l of rl){ if(!l.includes('"txid":"')) continue; const i=l.indexOf('"txid":"'); const t=l.slice(i+8,i+72); if(ids.has(t)){const j=JSON.parse(l); const a=ids.get(t)||[]; a.push({lane:j.sender,fam:j.family,res:j.result,why:j.reason,ts:j.ts,tip_seq:j.tip_seq,rpc_ms:j.rpc_ms}); ids.set(t,a);} } }
const keysOf=(o)=>Object.keys(o||{});
const H=new Map(), FS=new Map(); if(arg("hops")) for(const l of fs.readFileSync(arg("hops"),"utf8").split("\n")){ if(!l) continue; const h=JSON.parse(l); if(h.txid) H.set(h.txid,h); FS.set(h.family+":"+h.seq,h); }
const live=new Set(); { const ka=keys.slice(0,4); const u=await r.getUtxosByAddresses({addresses:ka}); for(const e of u.entries||[]) live.add(String(e.outpoint.transactionId)+":"+e.outpoint.index); }
let first=true;
for(const e of ours){ const t=e.transaction; if(first){console.log("entry keys",keysOf(e),"tx keys",keysOf(t),"vd keys",keysOf(t.verboseData)); first=false;}
  const outs=(t.outputs||[]).map(o=>`${(Number(o.value)/1e8).toFixed(4)}:${who(o)}${o.covenant?":cov":""}`);
  const ins=(t.inputs||[]).length;
  const st=ids.get(idOf(e));
  const ext={}; const tid=idOf(e); ext.landed_in_hoplog=H.has(tid)?("seq"+H.get(tid).seq):false;
  ext.ins=(t.inputs||[]).map(i=>{const p=String(i.previousOutpoint.transactionId); const h=H.get(p); return {prev_in_hoplog:h?("f"+h.family+"s"+h.seq):false, live_funding:live.has(p+":"+i.previousOutpoint.index)};});
  if(st&&st[0]){const w=FS.get(st[0].fam+":"+(st[0].tip_seq+1)); ext.next_seq_landed=w?(w.txid===tid?"ours":"other:"+(w.source||"")+":"+(w.accept_header_utc||w.seen_utc||"")):"none";}
  console.log(JSON.stringify({ext,pre:pre.has(idOf(e)),orphan:!!e.isOrphan,fee_tkas:Number(e.fee)/1e8,mass:String(t.mass??""),storageMass:String(t.storageMass??""),computeMass:String(t.verboseData?.computeMass??""),ins,outs,sub:st}));
}
console.log("total",es.length,"ours",ours.length);
await r.disconnect(); process.exit(0);
