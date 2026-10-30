<#
.SYNOPSIS
  launch-desk.ps1: start desk lanes (broker, optional coordinator, senders). Refuses to start unless handoff-guard.mjs
  passes (handoff.json present, sha256 ok, created on/after run date, family count). Logs clock offset vs NTP at start.
  TESTNET-10 ONLY. Never starts, stops or changes kaspad.
.EXAMPLE
  .\launch-desk.ps1 -Kit <kit> -Config <run>\config.json -RunDate 2026-10-30 -Families 4 [-Lanes desk,muon,boson] [-Coordinator] [-Takeover]
  .\launch-desk.ps1 ... -GuardOnly     # only run the guard + clock check, start nothing
#>
param([string]$Kit, [string]$Config, [string]$RunDate, [int]$Families = 4, [string[]]$Lanes = @('desk'),
      [hashtable]$LaneNodes = @{ desk = 'ws://127.0.0.1:17210' }, [string]$NodeExe = 'node',
      [switch]$Coordinator, [switch]$Takeover, [switch]$GuardOnly, [switch]$AllowTest)
$ErrorActionPreference = 'Stop'
$env:STORM_CONFIG = $Config
$run = (Get-Content $Config -Raw | ConvertFrom-Json).run_dir
if (Test-Path "$run\control\STOP") { "control/STOP present; not starting"; exit 1 }
New-Item -ItemType Directory -Force "$run\out", "$run\logs" | Out-Null
# 1. clock offset (no admin needed); logged so per-second counts can be corrected by the offset
& $NodeExe "$Kit\clock-offset.mjs" --samples 5 --log "$run\logs\clock-desk.csv"
# 2. handoff guard: no valid handoff, no senders
$ga = @("$Kit\handoff-guard.mjs", '--dir', $run, '--run-date', $RunDate, '--families', $Families); if ($AllowTest) { $ga += '--allow-test' }
& $NodeExe @ga; $g = $LASTEXITCODE
"$((Get-Date).ToUniversalTime().ToString('o')) guard exit=$g" | Add-Content "$run\logs\phase.log"
if ($g -ne 0) { "REFUSED: handoff guard exit $g; senders not started"; exit 2 }
if ($GuardOnly) { "guard OK (GuardOnly: nothing started)"; exit 0 }
& $NodeExe "$Kit\handoff.mjs" import "$run\handoff.json"; if ($LASTEXITCODE -ne 0) { "REFUSED: import failed"; exit 3 }
$s = @{ WorkingDirectory = $Kit; WindowStyle = 'Hidden'; PassThru = $true }
$b = Start-Process $NodeExe -ArgumentList 'builder-broker.mjs' @s -RedirectStandardOutput "$run\out\broker.out" -RedirectStandardError "$run\out\broker.err"
Start-Sleep 3; "broker pid $($b.Id)"
if ($Coordinator) { $c = Start-Process $NodeExe -ArgumentList 'coordinator.mjs' @s -RedirectStandardOutput "$run\out\coord.out" -RedirectStandardError "$run\out\coord.err"; "coordinator pid $($c.Id)" }
if ($Takeover) { $c = Start-Process $NodeExe -ArgumentList 'coordinator.mjs --takeover --label desk --reason mini_dead' @s -RedirectStandardOutput "$run\out\coord-takeover.out" -RedirectStandardError "$run\out\coord-takeover.err"; "takeover coordinator pid $($c.Id)" }
$src = if ($Coordinator -or $Takeover) { 'coord' } else { 'self' }
foreach ($l in $Lanes) {   # all lanes start in the same second so the window has every sender on
  $p = Start-Process $NodeExe -ArgumentList "sender.mjs --label $l --source $src --node $($LaneNodes[$l])" @s -RedirectStandardOutput "$run\out\sender-$l.out" -RedirectStandardError "$run\out\sender-$l.err"
  "sender $l pid $($p.Id)"
}
"stop: New-Item $run\control\STOP"
