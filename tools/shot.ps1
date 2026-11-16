param([string]$Url, [string]$Name, [int]$W = 1440, [int]$H = 900, [int]$Budget = 15000)
# Headless Edge screenshot of a page, saved under tools\shots (git-ignored).
# Usage: .\tools\shot.ps1 -Url http://localhost:4321/index.html -Name home -W 1440 -H 9000
$S = Split-Path -Parent $MyInvocation.MyCommand.Path
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out = Join-Path $S "shots\$Name.png"
if (Test-Path $out) { Remove-Item $out -Confirm:$false }
$args = @(
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--disk-cache-size=1",
  "--user-data-dir=`"$S\edge-profile`"", "--window-size=$W,$H", "--virtual-time-budget=$Budget",
  "--screenshot=`"$out`"", "`"$Url`""
)
$p = Start-Process -FilePath $edge -ArgumentList $args -PassThru -Wait -WindowStyle Hidden
if (Test-Path $out) { "$Name ok" } else { "$Name FAILED (exit $($p.ExitCode))" }
