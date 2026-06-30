# Download + validate v2 assets: exact images + meme sound MP3s. Generates JS maps.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wjw34kdet.output"
$imgDir = Join-Path $root 'assets\memes'
$sndDir = Join-Path $root 'assets\sounds'
New-Item -ItemType Directory -Force $imgDir | Out-Null
New-Item -ItemType Directory -Force $sndDir | Out-Null
$j = Get-Content $outfile -Raw | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function ImgExt([byte[]]$b) {
  if ($b.Length -lt 12) { return $null }
  if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { return 'jpg' }
  if ($b[0] -eq 0x89 -and $b[1] -eq 0x50) { return 'png' }
  if ($b[0] -eq 0x47 -and $b[1] -eq 0x49) { return 'gif' }
  if ($b[0] -eq 0x52 -and $b[1] -eq 0x49 -and $b[8] -eq 0x57) { return 'webp' }
  return $null
}
function SndExt([byte[]]$b) {
  if ($b.Length -lt 12) { return $null }
  if ($b[0] -eq 0x49 -and $b[1] -eq 0x44 -and $b[2] -eq 0x33) { return 'mp3' }            # ID3
  if ($b[0] -eq 0xFF -and ($b[1] -band 0xE0) -eq 0xE0) { return 'mp3' }                    # mp3 frame sync
  if ($b[0] -eq 0x4F -and $b[1] -eq 0x67 -and $b[2] -eq 0x67 -and $b[3] -eq 0x53) { return 'ogg' } # OggS
  if ($b[0] -eq 0x52 -and $b[1] -eq 0x49 -and $b[8] -eq 0x57 -and $b[9] -eq 0x41) { return 'wav' } # RIFF..WAVE
  return $null
}
function Fetch($url, $referer) {
  $tmp = Join-Path $env:TEMP ('dlv2_' + [Guid]::NewGuid().ToString('N') + '.bin')
  try { Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{ 'User-Agent' = $ua; 'Referer' = $referer } -TimeoutSec 30 -ErrorAction Stop }
  catch { return $null }
  if (-not (Test-Path $tmp)) { return $null }
  return $tmp
}

# ---- images ----
$imgOK = 0
foreach ($m in $j.result.images) {
  foreach ($url in $m.candidates) {
    $tmp = Fetch $url 'https://www.google.com/'; if (-not $tmp) { continue }
    $b = [System.IO.File]::ReadAllBytes($tmp); if ($b.Length -lt 700) { continue }
    $e = ImgExt $b; if (-not $e) { continue }
    # remove any stale ext for this id, then save
    Get-ChildItem $imgDir -Filter ($m.id + '.*') -ErrorAction SilentlyContinue | Remove-Item -Force
    Copy-Item $tmp (Join-Path $imgDir ($m.id + '.' + $e)) -Force
    Write-Host ("IMG OK   {0,-16} {1}.{2}" -f $m.id, $m.id, $e); $imgOK++; break
  }
}
# ---- sounds ----
$sndOK = 0
foreach ($s in $j.result.sounds) {
  $done = $false
  foreach ($url in $s.candidates) {
    $tmp = Fetch $url 'https://www.myinstants.com/'; if (-not $tmp) { continue }
    $b = [System.IO.File]::ReadAllBytes($tmp); if ($b.Length -lt 1500) { continue }
    $e = SndExt $b; if (-not $e) { continue }
    Copy-Item $tmp (Join-Path $sndDir ($s.key + '.' + $e)) -Force
    Write-Host ("SND OK   {0,-16} {1}.{2}  ({3} KB)" -f $s.key, $s.key, $e, [math]::Round($b.Length/1KB)); $sndOK++; $done = $true; break
  }
  if (-not $done) { Write-Host ("SND FAIL {0}" -f $s.key) }
}

# ---- regenerate JS maps ----
$imgFiles = Get-ChildItem $imgDir -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$' }
$ip = ($imgFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/memes/$($_.Name)'" }) -join ",`n"
"window.MEME_LOCAL = {`n$ip`n};" | Out-File (Join-Path $root 'js\meme_local.js') -Encoding utf8

$sndFiles = Get-ChildItem $sndDir -File | Where-Object { $_.Extension -match '\.(mp3|ogg|wav)$' }
$sp = ($sndFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/sounds/$($_.Name)'" }) -join ",`n"
"window.MEME_SOUNDS = {`n$sp`n};" | Out-File (Join-Path $root 'js\meme_sounds.js') -Encoding utf8

"`n==== images: $imgOK/$($j.result.images.Count) new; sounds: $sndOK/$($j.result.sounds.Count) ===="
"meme images total: $($imgFiles.Count) ; sound files: $($sndFiles.Count)"