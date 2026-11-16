param([string]$Name, [int]$Slice = 1800, [double]$Scale = 0.6)
# Cuts shots\<Name>.png into vertical slices (shots\<Name>-<n>.png), scaled down for reading.
Add-Type -AssemblyName System.Drawing
$S = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = [System.Drawing.Image]::FromFile((Join-Path $S "shots\$Name.png"))
$n = [Math]::Ceiling($src.Height / $Slice)
for ($i = 0; $i -lt $n; $i++) {
  $h = [Math]::Min($Slice, $src.Height - $i * $Slice)
  $w2 = [int]($src.Width * $Scale); $h2 = [int]($h * $Scale)
  $bmp = New-Object System.Drawing.Bitmap $w2, $h2
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w2, $h2), (New-Object System.Drawing.Rectangle 0, ($i * $Slice), $src.Width, $h), [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save((Join-Path $S "shots\$Name-$i.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
$src.Dispose()
"$Name -> $n slices"
