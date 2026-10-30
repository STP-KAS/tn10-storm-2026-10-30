<# mini-a3.ps1: mini side of step 3 attempt a3. Reuses a2's families (coordinator --takeover catches each up to its tip),
   then exports + pushes the handoff. Run DETACHED. TESTNET-10 ONLY. Never touches kaspad. #>
param([string]$Run, [string]$Kit = 'C:\Users\<mini-user>\tn10-storm-kit', [string]$Kit30 = 'C:\Users\<mini-user>\tn10-storm-2026-10-30\kit', [int]$Families = 4, [int]$RecoveryMin = 20)
$ErrorActionPreference = 'Continue'
$NodeExe = "$Kit\node\node.exe"; $env:STORM_CONFIG = "$Run\config.json"; $cfg = gc "$Run\config.json" -Raw | ConvertFrom-Json
$END = [DateTimeOffset]::Parse($cfg.end_utc).UtcDateTime
$ph = { param($m) "$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')) $m" | Add-Content "$Run\logs\phase.log" }
& $NodeExe "$Kit30\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-mini.csv" | Out-Null
$s = @{ WindowStyle = 'Hidden'; PassThru = $true }
$w = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $Kit\node-watch.ps1 -Kit $Kit -Label mini -Out $Run\logs -NodeExe $NodeExe" @s
$pe = Start-Process $NodeExe -ArgumentList "$Kit30\post-end.mjs --sdk $($cfg.kaspa_sdk) --url ws://127.0.0.1:17210 --label mini --out $Run\logs --end $($cfg.end_utc) --minutes $RecoveryMin" @s -RedirectStandardOutput "$Run\out\post-end.out" -RedirectStandardError "$Run\out\post-end.err"
$b = Start-Process $NodeExe -ArgumentList 'builder-broker.mjs' -WorkingDirectory $Kit @s -RedirectStandardOutput "$Run\out\broker.out" -RedirectStandardError "$Run\out\broker.err"
Start-Sleep 3
$c = Start-Process $NodeExe -ArgumentList 'coordinator.mjs --takeover --label mini --reason reuse_a2_families' -WorkingDirectory $Kit @s -RedirectStandardOutput "$Run\out\coord.out" -RedirectStandardError "$Run\out\coord.err"
& $ph "WATCH node=mini pid=$($w.Id) broker=$($b.Id) coord=$($c.Id) post_end=$($pe.Id)"
while ($true) { $n = (sls -Path "$Run\logs\phase.log" -Pattern ' (TIP|FAMILY_DROP) ' -ea 0 | measure).Count; if ($n -ge $Families -or $c.HasExited) { break }; Start-Sleep -Milliseconds 250 }
Push-Location $Kit30
& $NodeExe "$Kit30\handoff.mjs" export | Out-File -Encoding ascii -NoNewline "$Run\handoff.json"
& $NodeExe "$Kit30\handoff-push.mjs" --file "$Run\handoff.json" --url (gc "$Run\private\desk.url") --token-file "$Run\private\handoff.token" *> "$Run\out\push.txt"
Pop-Location
while ([DateTime]::UtcNow -lt $END) { Start-Sleep 5 }
& $ph "END reason=window"
Start-Sleep 60; & $NodeExe "$Kit30\clock-offset.mjs" --samples 5 --log "$Run\logs\clock-mini.csv" | Out-Null
while ([DateTime]::UtcNow -lt $END.AddMinutes($RecoveryMin).AddSeconds(10)) { Start-Sleep 5 }
Get-CimInstance Win32_Process -Filter "ParentProcessId=$($w.Id)" | % { Stop-Process -Id $_.ProcessId -Force -ea 0 }; Stop-Process -Id $w.Id -Force -ea 0
foreach ($p in $b, $c) { if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ea 0 } }
& $ph "RECOVERY_DONE minutes=$RecoveryMin"
