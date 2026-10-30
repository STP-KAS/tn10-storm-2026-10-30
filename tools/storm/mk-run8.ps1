<# mk-run8.ps1 (30 Oct a8): make a run dir from the a7 config with fresh launch paths and new times (desk and mini; on the mini
   drop "-DateKind String", Windows PowerShell 5 keeps the strings anyway). Copies the handoff token (and desk.url on the mini). #>
param([string]$Name,[string]$Tag,[string]$Check,[string]$From,[string]$End,[int]$Fam=4)
$b="C:\Users\<user>\tn10-storm-2026-10-30"; $R="$b\$Name"; New-Item -ItemType Directory -Force "$R\out","$R\logs","$R\private","$R\state","$R\control" | Out-Null
$c = gc "$b\step3-a7\config.json" -Raw | ConvertFrom-Json -DateKind String
$c.families = @(1..$Fam | % { @{family=$_;key=$_-1;launch_path="launch::storm-2026-10-30-$Tag-f$_"} })
$c.run_dir=$R; $c.sec_from_utc=$Check; $c.family_check_utc=$Check; $c.end_utc=$End
$c.schedule=@(@{step='3';from=$From;to=$End;families=$Fam;rate=5})
$c | ConvertTo-Json -Depth 6 | Set-Content "$R\config.json"
Copy-Item "$b\step3-a7\private\handoff.token" "$R\private\"   # mini: also desk.url
