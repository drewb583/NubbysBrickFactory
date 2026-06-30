# Download enrichment themed memes (imgs+sounds) + dedicated themed death sounds. Regen maps.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\hyper\NubbysBrickFactory'
$outfile = "C:\Users\hyper\AppData\Local\Temp\claude\C--Users-hyper\2833cf35-6b67-4f95-9807-8c4277432c57\tasks\wbgzy412k.output"
$imgDir = Join-Path $root 'assets\memes'; $sndDir = Join-Path $root 'assets\sounds'
$j = Get-Content $outfile -Raw | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
function ImgExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0xFF-and$b[1]-eq0xD8){'jpg'}elseif($b[0]-eq0x89-and$b[1]-eq0x50){'png'}elseif($b[0]-eq0x47-and$b[1]-eq0x49){'gif'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57){'webp'}else{$null} }
function SndExt([byte[]]$b){ if($b.Length-lt12){return $null}; if($b[0]-eq0x49-and$b[1]-eq0x44-and$b[2]-eq0x33){'mp3'}elseif($b[0]-eq0xFF-and(($b[1]-band0xE0)-eq0xE0)){'mp3'}elseif($b[0]-eq0x4F-and$b[1]-eq0x67-and$b[2]-eq0x67){'ogg'}elseif($b[0]-eq0x52-and$b[1]-eq0x49-and$b[8]-eq0x57-and$b[9]-eq0x41){'wav'}else{$null} }
function Fetch($url,$ref){ $tmp=Join-Path $env:TEMP ('en_'+[Guid]::NewGuid().ToString('N')+'.bin'); try{Invoke-WebRequest -Uri $url -OutFile $tmp -Headers @{'User-Agent'=$ua;'Referer'=$ref} -TimeoutSec 10 -ErrorAction Stop}catch{return $null}; if(Test-Path $tmp){$tmp}else{$null} }

$okImg=@(); $okSnd=@()
foreach($m in $j.result.memes){
  if($m.images.Count -and -not (Get-ChildItem $imgDir -Filter ($m.id+'.*') -ErrorAction SilentlyContinue)){
    foreach($url in $m.images){ $t=Fetch $url 'https://www.google.com/'; if(-not $t){continue}; $b=[System.IO.File]::ReadAllBytes($t); if($b.Length-lt700){continue}; $e=ImgExt $b; if(-not $e){continue}; Copy-Item $t (Join-Path $imgDir ($m.id+'.'+$e)) -Force; $okImg+=$m.id; break }
  }
  if($m.sounds.Count -and -not (Get-ChildItem $sndDir -Filter ($m.id+'.*') -ErrorAction SilentlyContinue)){
    foreach($url in $m.sounds){ $t=Fetch $url 'https://www.myinstants.com/'; if(-not $t){continue}; $b=[System.IO.File]::ReadAllBytes($t); if($b.Length-lt1200){continue}; $e=SndExt $b; if(-not $e){continue}; Copy-Item $t (Join-Path $sndDir ($m.id+'.'+$e)) -Force; $okSnd+=$m.id; break }
  }
}

# dedicated themed DEATH sounds (try real, else copy an existing themed sound)
function GetDeath($id, $cands, $fallbackFile){
  if(Get-ChildItem $sndDir -Filter ($id+'.*') -ErrorAction SilentlyContinue){ return }
  foreach($url in $cands){ $t=Fetch $url 'https://www.myinstants.com/'; if(-not $t){continue}; $b=[System.IO.File]::ReadAllBytes($t); if($b.Length-lt1200){continue}; $e=SndExt $b; if(-not $e){continue}; Copy-Item $t (Join-Path $sndDir ($id+'.'+$e)) -Force; "DEATH $id.$e (real)"; return }
  $fb = Get-ChildItem $sndDir -Filter $fallbackFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if($fb){ Copy-Item $fb.FullName (Join-Path $sndDir ($id+$fb.Extension)) -Force; "DEATH $id (copied $($fb.Name))" }
}
GetDeath 'retro_death' @('https://www.myinstants.com/media/sounds/smb_mariodie.mp3','https://www.myinstants.com/media/sounds/mario-death-sound.mp3','https://www.myinstants.com/media/sounds/mario-dies.mp3') 'retro_megaman.*'
GetDeath 'creepy_death' @('https://www.myinstants.com/media/sounds/you-died.mp3','https://www.myinstants.com/media/sounds/wilhelm-scream.mp3','https://www.myinstants.com/media/sounds/dark-souls-you-died.mp3') 'creepy_scream.*'

# regen maps
$imgFiles = Get-ChildItem $imgDir -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$' }
$ip = ($imgFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/memes/$($_.Name)'" }) -join ",`n"
"window.MEME_LOCAL = {`n$ip`n};" | Out-File (Join-Path $root 'js\meme_local.js') -Encoding utf8
$sndFiles = Get-ChildItem $sndDir -File | Where-Object { $_.Extension -match '\.(mp3|ogg|wav)$' }
$sp = ($sndFiles | Sort-Object BaseName | ForEach-Object { "  $($_.BaseName): 'assets/sounds/$($_.Name)'" }) -join ",`n"
"window.MEME_SOUNDS = {`n$sp`n};" | Out-File (Join-Path $root 'js\meme_sounds.js') -Encoding utf8

"==== enrich imgs: $($okImg.Count) ; enrich snds: $($okSnd.Count) ===="
"new retro imgs: " + (($imgFiles | Where-Object { $_.BaseName -like 'retro_*' } | ForEach-Object BaseName) -join ', ')
"new creepy imgs: " + (($imgFiles | Where-Object { $_.BaseName -like 'creepy_*' } | ForEach-Object BaseName) -join ', ')
"totals -> images:$($imgFiles.Count) sounds:$($sndFiles.Count)"