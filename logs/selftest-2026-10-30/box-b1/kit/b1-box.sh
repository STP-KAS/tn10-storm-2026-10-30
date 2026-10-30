#!/usr/bin/env bash
# b1-box.sh: box-only sender run (desk busy). Waits for handoff.json (copied from the mini), imports, preflight (lanes+clock),
# 4 senders (muon, muon2, boson, boson2; one builder each; source=self), health every 5 s, clock keeper, END, recovery. TESTNET-10 ONLY.
cd "$(dirname "$0")"; export STORM_CONFIG=<box-run-root>/b1/config.json STORM_BUILDER_DIRECT=1
R=<box-run-root>/b1; mkdir -p $R/out $R/logs; ph(){ echo "$(date -u +%FT%TZ) $*" >> $R/logs/phase.log; }
T0=$(date -d 2026-10-30T19:20:00Z +%s); END=$(date -d 2026-10-30T19:50:00Z +%s); REC=$((END+1200))
nohup ./health.sh $R/logs/health-box.csv $REC >/dev/null 2>&1 & ph "HEALTH pid=$!"
ck(){ node clock-offset.mjs --samples 3 --log $R/logs/clock-box.csv | sed -E 's/.*offset_ms=(-?[0-9.]+).*/\1/'; }
( while [ $(date +%s) -lt $REC ]; do o=$(ck); if [ -n "$o" ] && awk "BEGIN{exit !($o>40||$o<-40)}"; then sudo -n date -s "@$(python3 -c "import time;print('%.3f'%(time.time()+$o/1000))")" >/dev/null && ph "CLOCK_STEP offset_ms=$o"; fi; sleep 120; done ) >/dev/null 2>&1 &
ph "CLOCKKEEP pid=$!"
while [ ! -f $R/handoff.json ] && [ $(date +%s) -lt $((T0-60)) ]; do sleep 1; done
[ -f $R/handoff.json ] || { ph "LAUNCH_ABORT reason=no_handoff"; exit 2; }
sleep 2; node handoff.mjs import $R/handoff.json > $R/out/import.txt 2>&1; ph "HANDOFF imported exit=$?"
node preflight.mjs > $R/out/preflight.txt 2>&1; pf=$?; ph "PREFLIGHT exit=$pf"; [ $pf -eq 0 ] || { ph "LAUNCH_ABORT reason=preflight"; exit 3; }
for L in muon muon2 boson boson2; do K=$(node -e "console.log(require('$STORM_CONFIG').lanes['$L'].key)"); U=$(node -e "console.log(require('$STORM_CONFIG').lanes['$L'].url)")
  nohup node sender.mjs --label $L --key $K --source self --node $U > $R/out/sender-$L.out 2> $R/out/sender-$L.err & ph "SENDER $L pid=$!"; done
while [ $(date +%s) -lt $T0 ]; do sleep 0.2; done; ph "START senders=muon,muon2,boson,boson2 families=4 rate=5"
while [ $(date +%s) -lt $END ]; do sleep 5; done; ph "END reason=window"
sleep 60; ph "SENDERS_EXITED left=$(pgrep -c -f 'sender.mjs --label')"; ck >/dev/null
while [ $(date +%s) -lt $REC ]; do sleep 5; done; pkill -f 'sender.mjs --label' ; ph "RECOVERY_DONE minutes=20"
