#!/usr/bin/env bash
# box health every 5 s: cpu %, load1, mem avail MB, gap_ms since last row (freeze/stall if > 7000). Small: ~60 B/row.
OUT=$1; END=$2; [ -f $OUT ] || echo "ts_utc,cpu_pct,load1,mem_avail_mb,gap_ms,node_procs,freeze" > $OUT
read -r _ a b c d e f g _ < /proc/stat; pt=$((a+b+c+d+e+f+g)); pi=$d; last=$(date +%s%3N)
while [ $(date +%s) -lt $END ]; do sleep 5
  read -r _ a b c d e f g _ < /proc/stat; t=$((a+b+c+d+e+f+g)); cpu=$(( (100*((t-pt)-(d-pi)))/((t-pt)>0?(t-pt):1) )); pt=$t; pi=$d
  now=$(date +%s%3N); gap=$((now-last)); last=$now; fr=0; [ $gap -gt 7000 ] && fr=1
  echo "$(date -u +%FT%T.%3NZ),$cpu,$(cut -d' ' -f1 /proc/loadavg),$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo),$gap,$(pgrep -c -f 'sender.mjs'),$fr" >> $OUT
done
