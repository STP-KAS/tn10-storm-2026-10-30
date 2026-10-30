<# desk-a3.ps1: self-test step 3 attempt a3, desk side. Run DETACHED (Start-Process) so it outlives any agent shell.
   TESTNET-10 ONLY. Never touches kaspad. Logs START/END/RECOVERY_DONE to phase.log. #>
param([string]$Run, [string]$Kit, [string]$OldKit = 'C:\Users\<desk-user>\tn10-storm-kit', [int]$RecoveryMin = 20, [switch]$Monitor, [int]$WatchPid, [int]$RecvPid)
$ErrorActionPreference = 'Continue'
$raw = gc "$Run\config.json" -Raw; $cfg = $raw | ConvertFrom-Json   # pwsh 7 turns ISO strings into local DateTime: read the raw text
$endS = [regex]::Match($raw, '"end_utc":\s*"([^"]+)"').Groups[1].Value; $t0S = [regex]::Match($raw, '"from":\s*"([^"]+)"').Groups[1].Value
$END = [DateTimeOffset]::Parse($endS).UtcDateTime; $T0 = [DateTimeOffset]::Parse($t0S).UtcDateTime
$ph = { param($m) "$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) $m" | Add-Content "$Run\logs\phase.log" }
$s = @{ WindowStyle = 'Hidden'; PassThru = $true }
if ($Monitor) { $w = @{ Id = $WatchPid }; $r = @{ Id = $RecvPid }; & $ph "MONITOR attach" } else {
& node "$Kit\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-desk.csv" | Out-Null
$r = Start-Process node -ArgumentList "$Kit\handoff-receiver.mjs --dir $Run --port 18600" @s -RedirectStandardOutput "$Run\out\recv.out" -RedirectStandardError "$Run\out\recv.err"
$w = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $OldKit\node-watch.ps1 -Kit $OldKit -Label desk -Out $Run\logs" @s
$pe = Start-Process node -ArgumentList "$Kit\post-end.mjs --sdk $($cfg.kaspa_sdk) --url ws://127.0.0.1:17210 --label desk --out $Run\logs --end $endS --minutes $RecoveryMin" @s -RedirectStandardOutput "$Run\out\post-end.out" -RedirectStandardError "$Run\out\post-end.err"
& $ph "WATCH node=desk pid=$($w.Id) receiver_pid=$($r.Id) post_end_pid=$($pe.Id)"
& "$Kit\launch-desk.ps1" -Kit $Kit -Config "$Run\config.json" -RunDate 2026-10-30 -Families 4 -GuardOnly *> "$Run\out\guard-pre.txt"
& $ph "GUARD_PRE exit=$LASTEXITCODE"
while (-not (Test-Path "$Run\handoff.json") -and [DateTime]::UtcNow -lt $T0.AddSeconds(-45)) { Start-Sleep 1 }
if (-not (Test-Path "$Run\handoff.json")) { & $ph "LAUNCH_ABORT reason=no_handoff"; exit 2 }
Start-Sleep 2; & $ph "HANDOFF seen_on_desk"
& "$Kit\launch-desk.ps1" -Kit $Kit -Config "$Run\config.json" -RunDate 2026-10-30 -Families 4 `
  -Lanes desk,mini,muon,boson -LaneNodes @{ desk = 'ws://127.0.0.1:17210'; mini = 'ws://127.0.0.1:17299'; muon = 'wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh'; boson = 'wss://boson-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh' } `
  -LaneKeys @{ desk = 0; mini = 1; muon = 2; boson = 3 } *> "$Run\out\launch.txt"
& $ph "LAUNCH exit=$LASTEXITCODE"
}
$pids = (sls -Path "$Run\out\launch.txt" -Pattern '(broker|sender \S+) pid (\d+)').Matches | % { [int]$_.Groups[2].Value }
while ([DateTime]::UtcNow -lt $T0) { Start-Sleep -Milliseconds 200 }
& $ph "START senders=desk,mini,muon,boson families=4 rate=$($cfg.schedule[0].rate)"
while ([DateTime]::UtcNow -lt $END) { Start-Sleep 1; foreach ($p in $pids) { if (-not (Get-Process -Id $p -ea 0)) { & $ph "PROC_EXIT pid=$p before_end"; $pids = $pids | ? { $_ -ne $p } } } }
& $ph "END reason=window"
$t = [DateTime]::UtcNow.AddSeconds(60); while ([DateTime]::UtcNow -lt $t -and ($pids | ? { Get-Process -Id $_ -ea 0 })) { Start-Sleep 1 }
& $ph "SENDERS_EXITED left=$((@($pids | ? { Get-Process -Id $_ -ea 0 })).Count)"
& node "$Kit\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-desk.csv" | Out-Null
while ([DateTime]::UtcNow -lt $END.AddMinutes($RecoveryMin).AddSeconds(10)) { Start-Sleep 5 }
Get-CimInstance Win32_Process -Filter "ParentProcessId=$($w.Id)" | % { Stop-Process -Id $_.ProcessId -Force -ea 0 }; Stop-Process -Id $w.Id,$r.Id -Force -ea 0
& $ph "RECOVERY_DONE minutes=$RecoveryMin"

