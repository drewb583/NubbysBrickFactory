# Fast finisher: short timeouts, skip already-present images, grab remaining images + all sounds.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wjw34kdet.output"
$imgDir = Join-Path $root 'assets\memes'
$sndDir = Join-Path $root 'assets\sounds'
New-Item -ItemType Directory -Force $imgDir | Out-Null
New-Item -ItemType Directory -Force $sndDir | Out-Null
$j = Get-Content $outfile -Raw | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function ImgExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0xFF-and$b[1]-eq0xD8){'jpg'}elseif($b[0]-eq0x89-and$b[1]-eq0x50){'png'}elseif($b[0]-eq0x47-and$b[1]-eq0x49){'gif'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57){'webp'}else{$null} }
function SndExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0x49-and$b[1]-eq0x44-and$b[2]-eq0x33){'mp3'}elseif($b[0]-eq0xFF-and(($b[1]-band0xE0)-eq0xE0)){'mp3'}elseif($b[0]-eq0x4F-and$b[1]-eq0x67-and$b[2]-eq0x67-and$b[3]-eq0x53){'ogg'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57-and$b[9]-eq0x41){'wav'}else{$null} }
function Fetch($url,$ref){ $tmp=Join-Path $env:TEMP ('df_'+[Guid]::NewGuid().ToString('N')+'.bin'); try{Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{'User-Agent'=$ua;'Referer'=$ref} -TimeoutSec 8 -ErrorAction Stop}catch{return $null}; if(Test-Path $tmp){$tmp}else{$null} }

$imgOK=0
foreach($m in $j.result.images){
  if(Get-ChildItem $imgDir -Filter ($m.id+'.*') -ErrorAction SilentlyContinue){ continue }  # already have it
  foreach($url in $m.candidates){ $tmp=Fetch $url 'https://www.google.com/'; if(-not $tmp){continue}; $b=[System.IO.File]::ReadAllBytes($tmp); if($b.Length-lt700){continue}; $e=ImgExt $b; if(-not $e){continue}; Copy-Item $tmp (Join-Path $imgDir ($m.id+'.'+$e)) -Force; Write-Host ("IMG  {0}.{1}" -f $m.id,$e); $imgOK++; break }
}
$sndOK=0; $sndFail=@()
foreach($s in $j.result.sounds){
  if(Get-ChildItem $sndDir -Filter ($s.key+'.*') -ErrorAction SilentlyContinue){ $sndOK++; continue }
  $done=$false
  foreach($url in $s.candidates){ $tmp=Fetch $url 'https://www.myinstants.com/'; if(-not $tmp){continue}; $b=[System.IO.File]::ReadAllBytes($tmp); if($b.Length-lt1200){continue}; $e=SndExt $b; if(-not $e){continue}; Copy-Item $tmp (Join-Path $sndDir ($s.key+'.'+$e)) -Force; Write-Host ("SND  {0}.{1} ({2}KB)" -f $s.key,$e,[math]::Round($b.Length/1KB)); $sndOK++; $done=$true; break }
  if(-not $done){ $sndFail+=$s.key }
}

$imgFiles = Get-ChildItem $imgDir -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$' }
$ip = ($imgFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/memes/$($_.Name)'" }) -join ",`n"
"window.MEME_LOCAL = {`n$ip`n};" | Out-File (Join-Path $root 'js\meme_local.js') -Encoding utf8
$sndFiles = Get-ChildItem $sndDir -File | Where-Object { $_.Extension -match '\.(mp3|ogg|wav)$' }
$sp = ($sndFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/sounds/$($_.Name)'" }) -join ",`n"
"window.MEME_SOUNDS = {`n$sp`n};" | Out-File (Join-Path $root 'js\meme_sounds.js') -Encoding utf8

"==== images on disk: $($imgFiles.Count) ; sounds on disk: $($sndFiles.Count) ===="
"sound fails: " + ($sndFail -join ', ')