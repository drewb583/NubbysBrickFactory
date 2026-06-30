# Download + validate real meme images locally (server-side, magic-byte checked).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wducjbtah.output"
$dir = Join-Path $root 'assets\memes'
New-Item -ItemType Directory -Force $dir | Out-Null

$j = Get-Content $outfile -Raw | ConvertFrom-Json
$memes = $j.result.memes
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function Get-Ext([byte[]]$b) {
  if ($b.Length -lt 12) { return $null }
  if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { return 'jpg' }
  if ($b[0] -eq 0x89 -and $b[1] -eq 0x50 -and $b[2] -eq 0x4E -and $b[3] -eq 0x47) { return 'png' }
  if ($b[0] -eq 0x47 -and $b[1] -eq 0x49 -and $b[2] -eq 0x46) { return 'gif' }
  if ($b[0] -eq 0x52 -and $b[1] -eq 0x49 -and $b[8] -eq 0x57 -and $b[9] -eq 0x45) { return 'webp' }
  return $null
}

$results = @()
foreach ($m in $memes) {
  $saved = $null; $usedUrl = $null
  foreach ($url in $m.candidates) {
    $tmp = Join-Path $env:TEMP ("dl_" + $m.id + ".bin")
    try {
      Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{ 'User-Agent' = $ua; 'Referer' = 'https://www.google.com/' } -TimeoutSec 25 -ErrorAction Stop
    } catch { continue }
    if (-not (Test-Path $tmp)) { continue }
    $bytes = [System.IO.File]::ReadAllBytes($tmp)
    if ($bytes.Length -lt 700) { continue }
    $ext = Get-Ext $bytes
    if (-not $ext) { continue }
    $dest = Join-Path $dir ($m.id + '.' + $ext)
    Copy-Item $tmp $dest -Force
    $saved = ($m.id + '.' + $ext); $usedUrl = $url
    break
  }
  $results += [pscustomobject]@{ id = $m.id; file = $saved; ok = [bool]$saved; url = $usedUrl }
  if ($saved) { Write-Host ("OK   {0,-18} {1}" -f $m.id, $saved) } else { Write-Host ("FAIL {0,-18} (no working candidate)" -f $m.id) }
}

$ok = ($results | Where-Object ok)
"`n==== SUMMARY: $($ok.Count)/$($results.Count) downloaded ===="
"FAILED: " + (($results | Where-Object { -not $_.ok } | ForEach-Object id) -join ', ')
# emit a JS map of id -> local file for the ones that worked
$pairs = ($ok | ForEach-Object { "  $($_.id): 'assets/memes/$($_.file)'" }) -join ",`n"
$jsPath = Join-Path $root 'js\meme_local.js'
"window.MEME_LOCAL = {`n$pairs`n};" | Out-File -FilePath $jsPath -Encoding utf8
"Wrote $jsPath"