// analyze-a9.cjs: run from the a9 raw dir (desk/ + mini/ unzipped). Prints counts/gaps/percentiles only, no txids. TESTNET-10 ONLY.
const fs=require("fs");const W0=Date.parse("2026-10-31T03:25:00Z"),W1=Date.parse("2026-10-31T05:25:00Z");
const hops=[];const uniq=new Set();const fam={};let bf=0,rs=0,rev=0,lines=0;
for(const l of fs.readFileSync("mini/private/hops.jsonl","utf8").split("\n")){if(!l)continue;lines++;const h=JSON.parse(l);uniq.add(h.family+":"+h.seq);if(h.source==="backfill")bf++;if(h.source==="resync")rs++;if(h.revert_of!=null||h.source==="revert")rev++;
 (fam[h.family]??=new Set()).add(h.seq);if(h.source!=="backfill"){const t=Date.parse(h.accept_header_utc||h.seen_utc);hops.push([t,h.family])}}
console.log("hoplines",lines,"uniq",uniq.size,"backfill",bf,"resync",rs,"revert",rev,"coord",lines-bf-rs-rev,"perfam",Object.entries(fam).map(([k,v])=>k+":"+v.size).join(" "));
hops.sort((a,b)=>a[0]-b[0]);const w=hops.filter(h=>h[0]>=W0&&h[0]<W1);
let mg=0,at=0;for(let i=1;i<w.length;i++){const g=w[i][0]-w[i-1][0];if(g>mg){mg=g;at=w[i-1][0]}}console.log("max gap all",mg,new Date(at).toISOString());
for(const f of [1,2,3,4]){const x=w.filter(h=>h[1]===f);let m=0,a=0;for(let i=1;i<x.length;i++){const g=x[i][0]-x[i-1][0];if(g>m){m=g;a=x[i-1][0]}}console.log("fam",f,"landed(non-bf)",x.length,"maxgap",m,new Date(a).toISOString())}
const ls=new Set(w.map(h=>Math.floor((h[0]-W0)/1000)));const miss=Array(12).fill(0);for(let k=0;k<7200;k++)if(!ls.has(k))miss[Math.floor(k/600)]++;console.log("missed land secs per 10min",miss.join(" "));
const R={};for(const s of ["desk","mini","muon","boson"]){for(const l of fs.readFileSync(`desk/private/submit-${s}.jsonl`,"utf8").split("\n")){if(!l)continue;const r=JSON.parse(l);const t=Date.parse(r.ts);if(t<W0||t>=W1)continue;const o=R[s]??={rpc:[],age:[],att10:Array(12).fill(0)};o.rpc.push(r.rpc_ms);if(r.tip_age_ms!=null)o.age.push(r.tip_age_ms);o.att10[Math.floor((t-W0)/600000)]++}}
const q=(a,p)=>{a.sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(p*a.length)-1)]};
for(const s in R){const o=R[s];console.log(s,"rpc p95",q(o.rpc,.95),"max",o.rpc[o.rpc.length-1],"tip_age p50",q(o.age,.5),"att/10min",o.att10.join(" "))}
// node-watch
for(const n of ["desk","mini"]){const rows=fs.readFileSync(`${n}/logs/node-watch-${n}.csv`,"utf8").trim().split("\n").slice(1).map(l=>l.split(","));
 const inw=rows.filter(r=>{const t=Date.parse(r[0]);return t>=W0&&t<W1});const rpc=inw.map(r=>+r[2]);let mg=0,prev=null;for(const r of inw){const t=Date.parse(r[0]);if(prev)mg=Math.max(mg,t-prev);prev=t}
 const pre=rows.filter(r=>Date.parse(r[0])<W0);const mp=a=>{const v=a.map(r=>+r[5]);return [Math.min(...v),Math.max(...v)]};
 console.log(n,"nw rows win",inw.length,"rpc p95",q(rpc.slice(),.95),"max",Math.max(...rpc),"maxgap",mg,"first",(Date.parse(inw[0][0])-W0)/1000,"last",(W1-Date.parse(inw.at(-1)[0]))/1000,
  "unsynced",inw.filter(r=>r[3]!=="1").length,"peers<8",inw.filter(r=>+r[4]<8).length,"peers min",Math.min(...inw.map(r=>+r[4])),"mempool pre",JSON.stringify(mp(pre)),"pre n",pre.length,"pre last",pre.at(-1)[5],"mempool win",JSON.stringify(mp(inw)));
 const lowp=inw.filter(r=>+r[4]<8).map(r=>r[0].slice(11,19));console.log(n,"peer dips",lowp.join(" "));
 const pe=fs.readFileSync(`${n}/logs/post-end-mempool-${n}.csv`,"utf8").trim().split("\n").slice(1).map(l=>l.split(","));const p10=pe.filter(r=>+r[2]<=600);
 console.log(n,"postend rows",pe.length,"mempool range",JSON.stringify(mp(pe.map(r=>[0,0,0,0,0,r[3]]))),"first 10min",JSON.stringify(mp(p10.map(r=>[0,0,0,0,0,r[3]]))),"at0",pe[0][3],"<=5 count",pe.filter(r=>+r[3]<=5).length);
}
for(const s of ["desk","mini","muon","boson"]){const v=fs.readFileSync(`desk/logs/pool-${s}.csv`,"utf8").trim().split("\n").map(l=>l.split(","));let mn=1e9,mt="";for(const r of v){if(+r[1]<mn){mn=+r[1];mt=r[0]}}console.log("pool",s,"start",v[0][1],"min",mn,mt,"end",v.at(-1)[1],v.at(-1)[0])}
const seq10=[];// throughput by hop log per 10 min (unique family seq incl backfill not timed) -> use landed non-bf
const c10=Array(12).fill(0);for(const h of w)c10[Math.floor((h[0]-W0)/600000)]++;console.log("landed(non-bf) per 10min hops/s",c10.map(x=>(x/600).toFixed(2)).join(" "));
