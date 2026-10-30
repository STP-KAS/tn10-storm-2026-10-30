<# mini-a5.ps1: mini side of step 3 attempt a5 (= a4 + recount with its own builder, loud failure if recount.csv is missing). FRESH genesis for 4 families (coordinator-a4 = no stop on STALL,
   async 30 s resync, genesis-state saved), handoff export + push, END, clock, then the independent after-END recount.
   Run DETACHED. TESTNET-10 ONLY. Never touches kaspad. #>
param([string]$Run, [string]$Kit = 'C:\Users\<mini-user>\tn10-storm-kit', [string]$Kit30 = 'C:\Users\<mini-user>\tn10-storm-2026-10-30\kit', [int]$Families = 4, [int]$RecoveryMin = 20)
$ErrorActionPreference = 'Continue'
$NodeExe = "$Kit\node\node.exe"; $env:STORM_CONFIG = "$Run\config.json"
$raw = gc "$Run\config.json" -Raw; $endS = [regex]::Match($raw, '"end_utc":\s*"([^"]+)"').Groups[1].Value
if (-not $endS) { throw 'config: end_utc missing' }
$END = [DateTimeOffset]::Parse($endS).UtcDateTime; $cfg = $raw | ConvertFrom-Json
New-Item -ItemType Directory -Force "$Run\logs", "$Run\out", "$Run\private", "$Run\state", "$Run\control" | Out-Null
$ph = { param($m) "$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) $m" | Add-Content "$Run\logs\phase.log" }
& $NodeExe "$Kit30\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-mini.csv" | Out-Null
$s = @{ WindowStyle = 'Hidden'; PassThru = $true }
$w = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $Kit\node-watch.ps1 -Kit $Kit -Label mini -Out $Run\logs -NodeExe $NodeExe" @s
$pe = Start-Process $NodeExe -ArgumentList "$Kit30\post-end.mjs --sdk $($cfg.kaspa_sdk) --url ws://127.0.0.1:17210 --label mini --out $Run\logs --end $endS --minutes $RecoveryMin" @s -RedirectStandardOutput "$Run\out\post-end.out" -RedirectStandardError "$Run\out\post-end.err"
$b = Start-Process $NodeExe -ArgumentList 'builder-broker.mjs' -WorkingDirectory $Kit @s -RedirectStandardOutput "$Run\out\broker.out" -RedirectStandardError "$Run\out\broker.err"
Start-Sleep 3
$c = Start-Process $NodeExe -ArgumentList 'coordinator-a4.mjs' -WorkingDirectory $Kit @s -RedirectStandardOutput "$Run\out\coord.out" -RedirectStandardError "$Run\out\coord.err"
& $ph "WATCH node=mini pid=$($w.Id) broker=$($b.Id) coord=$($c.Id) post_end=$($pe.Id)"
while ($true) { $n = (sls -Path "$Run\logs\phase.log" -Pattern ' (GENESIS|FAMILY_DROP) ' -ea 0 | measure).Count; if ($n -ge $Families -or $c.HasExited) { break }; Start-Sleep -Milliseconds 250 }
Push-Location $Kit30
& $NodeExe "$Kit30\handoff.mjs" export | Out-File -Encoding ascii -NoNewline "$Run\handoff.json"
& $NodeExe "$Kit30\handoff-push.mjs" --file "$Run\handoff.json" --url (gc "$Run\private\desk.url") --token-file "$Run\private\handoff.token" *> "$Run\out\push.txt"
Pop-Location
while ([DateTime]::UtcNow -lt $END) { Start-Sleep 5 }
& $ph "END reason=window"
Start-Sleep 60; & $NodeExe "$Kit30\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-mini.csv" | Out-Null
$env:STORM_BUILDER_DIRECT = '1'   # 30 Oct a5: the recount spawns its own builder; the broker exits with the coordinator at END
$rc = Start-Process $NodeExe -ArgumentList 'recount.mjs' -WorkingDirectory $Kit @s -RedirectStandardOutput "$Run\out\recount.out" -RedirectStandardError "$Run\out\recount.err"
& $ph "RECOUNT pid=$($rc.Id)"
while ([DateTime]::UtcNow -lt $END.AddMinutes($RecoveryMin).AddSeconds(10)) { Start-Sleep 5 }
Get-CimInstance Win32_Process -Filter "ParentProcessId=$($w.Id)" | % { Stop-Process -Id $_.ProcessId -Force -ea 0 }; Stop-Process -Id $w.Id -Force -ea 0
foreach ($p in $b, $c) { if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ea 0 } }
$rcN = if (Test-Path "$Run\logs\recount.csv") { (gc "$Run\logs\recount.csv" | measure).Count - 1 } else { -1 }
if ($rcN -lt $Families) { & $ph "RECOUNT_FAIL rows=$rcN need=$Families exit=$(if ($rc.HasExited) { $rc.ExitCode } else { 'running' })" } else { & $ph "RECOUNT_OK rows=$rcN" }   # 30 Oct a5: fail loudly
& $ph "RECOVERY_DONE minutes=$RecoveryMin"
