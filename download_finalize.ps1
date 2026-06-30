# Finalize v4: set pingas = chosen candidate c1, download new meme sounds, regen maps, cleanup.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wkdap1od5.output"
$imgDir = Join-Path $root 'assets\memes'
$sndDir = Join-Path $root 'assets\sounds'
$candDir = Join-Path $root 'assets\_pingas_cand'

# 1) pingas -> c1
$c1 = Join-Path $candDir 'c1.jpg'
if (Test-Path $c1) {
  Get-ChildItem $imgDir -Filter 'pingas.*' -ErrorAction SilentlyContinue | Remove-Item -Force
  Copy-Item $c1 (Join-Path $imgDir 'pingas.jpg') -Force
  "PINGAS set -> pingas.jpg (from c1)"
} else { "ERROR: c1 not found" }

# 2) new meme sounds
$j = Get-Content $outfile -Raw | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
function SndExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0x49-and$b[1]-eq0x44-and$b[2]-eq0x33){'mp3'}elseif($b[0]-eq0xFF-and(($b[1]-band0xE0)-eq0xE0)){'mp3'}elseif($b[0]-eq0x4F-and$b[1]-eq0x67-and$b[2]-eq0x67){'ogg'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57-and$b[9]-eq0x41){'wav'}else{$null} }
function Fetch($url){ $tmp=Join-Path $env:TEMP ('fin_'+[Guid]::NewGuid().ToString('N')+'.bin'); try{Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{'User-Agent'=$ua;'Referer'='https://www.myinstants.com/'} -TimeoutSec 8 -ErrorAction Stop}catch{return $null}; if(Test-Path $tmp){$tmp}else{$null} }
$ok=0
foreach($s in $j.result.sounds){
  if(-not $s.candidates -or $s.candidates.Count -eq 0){ continue }
  if(Get-ChildItem $sndDir -Filter ($s.key+'.*') -ErrorAction SilentlyContinue){ continue }  # keep existing
  foreach($url in $s.candidates){
    $tmp=Fetch $url; if(-not $tmp){continue}
    $b=[System.IO.File]::ReadAllBytes($tmp); if($b.Length-lt1200){continue}
    $e=SndExt $b; if(-not $e){continue}
    Copy-Item $tmp (Join-Path $sndDir ($s.key+'.'+$e)) -Force
    "SND  $($s.key).$e ($([math]::Round($b.Length/1KB))KB)"; $ok++; break
  }
}

# 3) regen maps
$imgFiles = Get-ChildItem $imgDir -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$' }
$ip = ($imgFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/memes/$($_.Name)'" }) -join ",`n"
"window.MEME_LOCAL = {`n$ip`n};" | Out-File (Join-Path $root 'js\meme_local.js') -Encoding utf8
$sndFiles = Get-ChildItem $sndDir -File | Where-Object { $_.Extension -match '\.(mp3|ogg|wav)$' }
$sp = ($sndFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/sounds/$($_.Name)'" }) -join ",`n"
"window.MEME_SOUNDS = {`n$sp`n};" | Out-File (Join-Path $root 'js\meme_sounds.js') -Encoding utf8

# 4) cleanup candidate folder
Remove-Item $candDir -Recurse -Force -ErrorAction SilentlyContinue

"==== new sounds added: $ok ; image files: $($imgFiles.Count) ; sound files: $($sndFiles.Count) ===="