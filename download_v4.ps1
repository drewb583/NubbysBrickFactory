# v4: download pingas candidates (for inspection) + new meme sounds. Regenerate sound map.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wkdap1od5.output"
$sndDir = Join-Path $root 'assets\sounds'
$candDir = Join-Path $root 'assets\_pingas_cand'
New-Item -ItemType Directory -Force $sndDir | Out-Null
New-Item -ItemType Directory -Force $candDir | Out-Null
Get-ChildItem $candDir -File -ErrorAction SilentlyContinue | Remove-Item -Force
$j = Get-Content $outfile -Raw | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
function ImgExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0xFF-and$b[1]-eq0xD8){'jpg'}elseif($b[0]-eq0x89-and$b[1]-eq0x50){'png'}elseif($b[0]-eq0x47-and$b[1]-eq0x49){'gif'}else{$null} }
function SndExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0x49-and$b[1]-eq0x44-and$b[2]-eq0x33){'mp3'}elseif($b[0]-eq0xFF-and(($b[1]-band0xE0)-eq0xE0)){'mp3'}elseif($b[0]-eq0x4F-and$b[1]-eq0x67-and$b[2]-eq0x67){'ogg'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57-and$b[9]-eq0x41){'wav'}else{$null} }
function Fetch($url,$ref){ $tmp=Join-Path $env:TEMP ('v4_'+[Guid]::NewGuid().ToString('N')+'.bin'); try{Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{'User-Agent'=$ua;'Referer'=$ref} -TimeoutSec 8 -ErrorAction Stop}catch{return $null}; if(Test-Path $tmp){$tmp}else{$null} }

# pingas candidates -> inspection folder (keep all that validate)
$i=0
foreach($url in $j.result.pingas){
  $tmp=Fetch $url 'https://www.google.com/'; if(-not $tmp){ "PINGAS cand $i FAIL $url"; $i++; continue }
  $b=[System.IO.File]::ReadAllBytes($tmp); $e=ImgExt $b
  if($e -and $b.Length -gt 700){ Copy-Item $tmp (Join-Path $candDir ("c$i.$e")) -Force; "PINGAS cand $i -> c$i.$e  ($([math]::Round($b.Length/1KB))KB)  $url" } else { "PINGAS cand $i INVALID $url" }
  $i++
}

# new sounds (own-sound files for memes that currently only have an alias)
$ok=0
foreach($s in $j.result.sounds){
  if(-not $s.candidates -or $s.candidates.Count -eq 0){ continue }
  foreach($url in $s.candidates){
    $tmp=Fetch $url 'https://www.myinstants.com/'; if(-not $tmp){continue}
    $b=[System.IO.File]::ReadAllBytes($tmp); if($b.Length-lt1200){continue}
    $e=SndExt $b; if(-not $e){continue}
    Get-ChildItem $sndDir -Filter ($s.key+'.*') -ErrorAction SilentlyContinue | Remove-Item -Force
    Copy-Item $tmp (Join-Path $sndDir ($s.key+'.'+$e)) -Force
    "SND  $($s.key).$e ($([math]::Round($b.Length/1KB))KB)"; $ok++; break
  }
}

# regenerate sound map (image map regenerated after we pick pingas)
$sndFiles = Get-ChildItem $sndDir -File | Where-Object { $_.Extension -match '\.(mp3|ogg|wav)$' }
$sp = ($sndFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/sounds/$($_.Name)'" }) -join ",`n"
"window.MEME_SOUNDS = {`n$sp`n};" | Out-File (Join-Path $root 'js\meme_sounds.js') -Encoding utf8
"==== new sounds: $ok ; total sound files: $($sndFiles.Count) ; pingas candidates in $candDir ===="
Get-ChildItem $candDir -File | ForEach-Object { $_.Name }