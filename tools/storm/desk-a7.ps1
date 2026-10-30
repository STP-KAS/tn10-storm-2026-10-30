<# desk-a7.ps1: self-test step 3 attempt a7 (a6 + fire-on-new-tip senders, pwsh 7 check, hard guard-refusal pre-check), desk side. Run DETACHED (Start-Process) so it outlives any agent shell.
   TESTNET-10 ONLY. Never touches kaspad. Logs START/END/RECOVERY_DONE to phase.log. #>
param([string]$Run, [string]$Kit, [string]$OldKit = 'C:\Users\<desk-user>\tn10-storm-kit', [int]$RecoveryMin = 20, [string]$BuilderRoots = 'C:\Users\<desk-user>\tn10-storm-2026-10-30\roots', [switch]$Monitor, [switch]$Relaunch, [int]$WatchPid, [int]$RecvPid)   # 30 Oct a6: -Relaunch = watch/receiver/post-end already running (pids given), redo guard + launch
$ErrorActionPreference = 'Continue'
$raw = gc "$Run\config.json" -Raw; $cfg = $raw | ConvertFrom-Json   # pwsh 7 turns ISO strings into local DateTime: read the raw text
$endS = [regex]::Match($raw, '"end_utc":\s*"([^"]+)"').Groups[1].Value; $t0S = [regex]::Match($raw, '"from":\s*"([^"]+)"').Groups[1].Value
if (-not $endS -or -not $t0S) { throw 'config: end_utc/from missing' }   # 30 Oct a3: never fall through on an empty date
$END = [DateTimeOffset]::Parse($endS).UtcDateTime; $T0 = [DateTimeOffset]::Parse($t0S).UtcDateTime
if ($END -le $T0) { throw 'config: END <= T0' }
$ph = { param($m) "$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) $m" | Add-Content "$Run\logs\phase.log" }
if ($PSVersionTable.PSVersion.Major -lt 7) { & $ph "LAUNCH_ABORT reason=pwsh version=$($PSVersionTable.PSVersion)"; exit 6 }   # 30 Oct a7: PS 5 died silently in a6
$s = @{ WindowStyle = 'Hidden'; PassThru = $true }
if ($Monitor) { $w = @{ Id = $WatchPid }; $r = @{ Id = $RecvPid }; & $ph "MONITOR attach" } else {
if ($Relaunch) { $w = @{ Id = $WatchPid }; $r = @{ Id = $RecvPid }; & $ph "RELAUNCH watch_pid=$WatchPid receiver_pid=$RecvPid" } else {
& node "$Kit\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-desk.csv" | Out-Null
$r = Start-Process node -ArgumentList "$Kit\handoff-receiver.mjs --dir $Run --port 18600" @s -RedirectStandardOutput "$Run\out\recv.out" -RedirectStandardError "$Run\out\recv.err"
$w = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $OldKit\node-watch.ps1 -Kit $OldKit -Label desk -Out $Run\logs" @s
$pe = Start-Process node -ArgumentList "$Kit\post-end.mjs --sdk $($cfg.kaspa_sdk) --url ws://127.0.0.1:17210 --label desk --out $Run\logs --end $endS --minutes $RecoveryMin" @s -RedirectStandardOutput "$Run\out\post-end.out" -RedirectStandardError "$Run\out\post-end.err"
& $ph "WATCH node=desk pid=$($w.Id) receiver_pid=$($r.Id) post_end_pid=$($pe.Id)" }
& "$Kit\launch-desk.ps1" -Kit $Kit -Config "$Run\config.json" -RunDate 2026-10-30 -Families 4 -GuardOnly *> "$Run\out\guard-pre.txt"
$gx = $LASTEXITCODE; $gref = [bool](sls -Path "$Run\out\guard-pre.txt" -Pattern 'GUARD_REFUSE|refus|exit=1[0-6]' -Quiet)
& $ph "GUARD_PRE exit=$gx refused=$([int]$gref)"
if (-not $Relaunch -and -not (Test-Path "$Run\handoff.json") -and -not $gref) { & $ph "LAUNCH_ABORT reason=guard_did_not_refuse"; exit 7 }   # 30 Oct a7: the guard must refuse before the handoff exists
while (-not (Test-Path "$Run\handoff.json") -and [DateTime]::UtcNow -lt $T0.AddSeconds(-45)) { Start-Sleep 1 }
if (-not (Test-Path "$Run\handoff.json")) { & $ph "LAUNCH_ABORT reason=no_handoff"; exit 2 }
Start-Sleep 2; & $ph "HANDOFF seen_on_desk"
$env:STORM_CONFIG = "$Run\config.json"; Push-Location $Kit
& node "$Kit\preflight.mjs" *> "$Run\out\preflight.txt"; $pf = $LASTEXITCODE; Pop-Location   # 30 Oct a3: DNS + wRPC + synced + coins per lane
& $ph "PREFLIGHT exit=$pf"
if ($pf -ne 0) { & $ph "LAUNCH_ABORT reason=preflight"; exit 3 }
$ln = @{}; $lk = @{}; foreach ($p in $cfg.lanes.PSObject.Properties) { $ln[$p.Name] = $p.Value.url; $lk[$p.Name] = [int]$p.Value.key }
& "$Kit\launch-desk.ps1" -Kit $Kit -Config "$Run\config.json" -RunDate 2026-10-30 -Families 4 `
  -Lanes @($cfg.lanes.PSObject.Properties.Name) -LaneNodes $ln -LaneKeys $lk -BuilderRoots $BuilderRoots *> "$Run\out\launch.txt"
& $ph "LAUNCH exit=$LASTEXITCODE"
}
$pids = (sls -Path "$Run\out\launch.txt" -Pattern '(broker|sender \S+) pid (\d+)').Matches | % { [int]$_.Groups[2].Value }
while ([DateTime]::UtcNow -lt $T0) { Start-Sleep -Milliseconds 200 }
& $ph "START senders=$(@($cfg.lanes.PSObject.Properties.Name) -join ',') families=4 rate=$($cfg.schedule[0].rate)"
$procLog = "$Run\logs\proc-host-desk.csv"; if (-not (Test-Path $procLog)) { 'ts_utc,name,pid,cpu_s,ws_mb' | Set-Content $procLog }
$logProc = { $ts = [DateTime]::UtcNow.ToString('o'); Get-Process node, kcc20 -ea 0 | % { "$ts,$($_.ProcessName),$($_.Id),$([math]::Round($_.CPU,1)),$([math]::Round($_.WorkingSet64/1MB))" } | Add-Content $procLog }   # 30 Oct a6: renamed (a5 collided with the desk sender log). cumulative CPU s + RAM of every node/builder process
$tick = 0
while ([DateTime]::UtcNow -lt $END) { Start-Sleep 1; if ((++$tick % 5) -eq 0) { & $logProc }; foreach ($p in $pids) { if (-not (Get-Process -Id $p -ea 0)) { & $ph "PROC_EXIT pid=$p before_end"; $pids = $pids | ? { $_ -ne $p } } } }
& $ph "END reason=window"
$t = [DateTime]::UtcNow.AddSeconds(60); while ([DateTime]::UtcNow -lt $t -and ($pids | ? { Get-Process -Id $_ -ea 0 })) { Start-Sleep 1 }
& $ph "SENDERS_EXITED left=$((@($pids | ? { Get-Process -Id $_ -ea 0 })).Count)"
& node "$Kit\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-desk.csv" | Out-Null
while ([DateTime]::UtcNow -lt $END.AddMinutes($RecoveryMin).AddSeconds(10)) { Start-Sleep 5 }
Get-CimInstance Win32_Process -Filter "ParentProcessId=$($w.Id)" | % { Stop-Process -Id $_.ProcessId -Force -ea 0 }; Stop-Process -Id $w.Id,$r.Id -Force -ea 0
& $ph "RECOVERY_DONE minutes=$RecoveryMin"

