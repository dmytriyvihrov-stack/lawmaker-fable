# ============================================================================
# Packages the game as an itch.io HTML5 upload: one zip with index.html at its
# ROOT, built WITHOUT the developer switch.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-itch.ps1
#   ... -Out D:\somewhere\lawmaker-fable-itch.zip   write it elsewhere
#   ... -Dev                                        package the build WITH the
#                                                   switch (do not send this to
#                                                   a stranger)
#   ... -SkipTests                                  no validate, no suite
#   ... -NoRestore                                  leave dist\ holding the
#                                                   player build
#
# WHAT IT IS. itch serves an HTML game by unzipping the upload and loading
# index.html in an IFRAME on a different origin from the itch page. This game
# is one self-contained file - stylesheet, script and both music tracks sewn in
# as data URIs by bundle.mjs - so the upload is that file under the name
# index.html and nothing else at all. No folder, no second request, no network.
#
# WHAT "NO DEV MODE" MEANS. `vite build --mode player` sets PLAYER_BUILD in
# App.tsx, which leaves out the switch in the bottom corner and everything
# behind it, the chapter fixtures on the title screen, and ?chapter= on the
# URL. ?see=end stays: the closing screen on a reign that never happened is a
# thing to show somebody rather than a tool.
#
# WHY IT READS THE ZIP BACK. Every silent or wrong build this project has
# shipped was produced by steps that all reported success. So the checks below
# are made against the bytes in the zip: index.html at the root and not one
# level down (the commonest itch mistake, answered with a blank frame and no
# reason), the player marker in the page, the developer switch gone, and the
# music actually sewn in.
#
# THE DEFAULT OUTPUT IS OUTSIDE THIS FOLDER, under %USERPROFILE%\lawmaker-itch.
# A 12 MB zip does not belong in the repository and does not want Google Drive
# syncing it while it is being written.
#
# ---------------------------------------------------------------------------
# KEEP THIS FILE PURE ASCII. PowerShell 5.1 reads a .ps1 as ANSI and the repo
# path contains Cyrillic ("Google <disk>"): a literal non-ASCII character here
# comes back as mojibake at runtime. Every path derives from $PSScriptRoot.
# ---------------------------------------------------------------------------
param(
  [string] $Out = '',
  [switch] $Dev,
  [switch] $SkipTests,
  [switch] $NoRestore
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($n, $t) { Write-Host ""; Write-Host "[$n] $t" -ForegroundColor Cyan }
function Die($t) { Write-Host ""; Write-Host "STOPPED: $t" -ForegroundColor Red; exit 1 }

if (-not (Test-Path (Join-Path $root 'package.json'))) { Die "this is not the build folder. Expected package.json next to tools\." }

if (-not $Out) { $Out = Join-Path $env:USERPROFILE 'lawmaker-itch\lawmaker-fable-itch.zip' }
$outDir = Split-Path -Parent $Out
if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

# ---- 1. the checks ---------------------------------------------------------
# The suite is the only thing that says the content is still legal. It costs
# about fifteen seconds and it has caught every content break this game has
# had, so it runs before anything is packaged rather than after.
if ($SkipTests) {
  Step 1 "tests: skipped (-SkipTests)"
} else {
  Step 1 "validate and test"
  & npm run validate
  if ($LASTEXITCODE -ne 0) { Die "npm run validate failed. Nothing is packaged from a red tree." }
  & npm test
  if ($LASTEXITCODE -ne 0) { Die "npm test failed. Nothing is packaged from a red tree." }
}

# ---- 2. build --------------------------------------------------------------
# One tsc over both entries, then vite in the mode that decides what is in the
# page. `--mode player` is the whole of "no dev mode": see the note at the top.
Step 2 "building the page"
& npx tsc -b
if ($LASTEXITCODE -ne 0) { Die "tsc -b failed" }
if ($Dev) {
  Write-Host "      -Dev: building WITH the developer switch" -ForegroundColor Yellow
  & npx vite build
} else {
  & npx vite build --mode player
}
if ($LASTEXITCODE -ne 0) { Die "vite build failed" }

# ---- 3. sew it into one file ----------------------------------------------
# Into a staging folder and never over lawmaker-fable.html: that file is the
# one the user opens at this desk and it is meant to keep its switch.
$stage = Join-Path $outDir '_stage'
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
$page = Join-Path $stage 'index.html'

Step 3 "sewing the stylesheet, the script and the music into index.html"
& node (Join-Path $root 'bundle.mjs') --out $page
if ($LASTEXITCODE -ne 0) { Die "bundle.mjs failed" }
if (-not (Test-Path -LiteralPath $page)) { Die "bundle.mjs reported success and wrote no file at $page" }

# ---- 4. zip ----------------------------------------------------------------
# NOT Compress-Archive. PowerShell 5.1 writes entry names with BACKSLASHES,
# which the zip spec forbids (4.4.17.1: forward slash, always). A lenient
# unzipper then makes a file literally called "a\b" out of it and a strict one
# refuses the entry, so the shape of the upload would be decided by whichever
# unzipper itch happens to run. The entry is written by hand instead.
Step 4 "zipping"
if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zw = [System.IO.Compression.ZipFile]::Open($Out, 'Create')
try {
  $prefix = (Resolve-Path -LiteralPath $stage).Path.TrimEnd('\') + '\'
  foreach ($f in (Get-ChildItem -LiteralPath $stage -Recurse -File)) {
    $rel = $f.FullName.Substring($prefix.Length).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zw, $f.FullName, $rel, 'Optimal')
  }
} finally { $zw.Dispose() }
$mb = [Math]::Round((Get-Item $Out).Length / 1MB, 2)

# ---- 5. read the zip back --------------------------------------------------
Step 5 "checking the zip itself"
$zip = [System.IO.Compression.ZipFile]::OpenRead($Out)
try {
  $names = $zip.Entries | ForEach-Object { $_.FullName }
  $index = $zip.Entries | Where-Object { $_.FullName -eq 'index.html' }
  if (-not $index) {
    Die "no index.html at the ROOT of the zip. itch would load a blank frame and say nothing.`n         entries: $($names -join ', ')"
  }
  $sr = New-Object System.IO.StreamReader($index.Open())
  try { $html = $sr.ReadToEnd() } finally { $sr.Close() }
} finally { $zip.Dispose() }

$tracks   = ([regex]::Matches($html, 'data:audio/')).Count
$isPlayer = $html.Contains('name="lawmaker-player"')
$hasSwitch = $html.Contains('data-dev-switch')
$pageMb   = [Math]::Round($html.Length / 1MB, 2)

"      entries      : $($names.Count) ($($names -join ', '))"
"      index.html   : at the root, $pageMb MB"
"      music        : $tracks track(s) sewn in"
"      developer    : $(if ($isPlayer -and -not $hasSwitch) { 'OFF - no switch, no chapter doors' } else { 'ON - this build has the developer switch in it' })"

$slashed = $names | Where-Object { $_ -like '*\*' }
if ($slashed) { Die "these zip entries carry a backslash, which the zip spec forbids and unzippers disagree about:`n         $($slashed -join ', ')" }
if ($tracks -lt 1) {
  Die "no music in the packaged page. assets\music\*.mp3 is empty or unreadable, and every player would get the synthesised pad instead of the score."
}
if (-not $Dev -and (-not $isPlayer -or $hasSwitch)) {
  Die "this was meant to be the build a stranger opens and the developer switch is still in it (marker $isPlayer, switch $hasSwitch)."
}
if ($Dev -and $isPlayer) { Die "-Dev asked for the build with the switch and the player marker is in the page." }

Remove-Item -LiteralPath $stage -Recurse -Force

# ---- 6. put the desk back --------------------------------------------------
# dist\ now holds a player build, and `node bundle.mjs` on its own reads dist\.
# Leaving it that way is how somebody later rebuilds their own file without a
# switch in it and spends an hour wondering where it went.
if ($NoRestore -or $Dev) {
  Step 6 "dist\ left holding this build (-NoRestore)"
} else {
  Step 6 "rebuilding dist\ and lawmaker-fable.html the ordinary way"
  & npm run bundle
  if ($LASTEXITCODE -ne 0) { Die "the itch zip is written and correct, but rebuilding the desk copy failed. Run: npm run bundle" }
}

Write-Host ""
Write-Host "READY TO UPLOAD: $Out  ($mb MB)" -ForegroundColor Green
Write-Host ""
Write-Host "On the itch project page, and these settings are the whole job:" -ForegroundColor Yellow
Write-Host "  Kind of project      : HTML"
Write-Host "  This file            : tick 'This file will be played in the browser'"
Write-Host "  Viewport             : 1280 x 800"
Write-Host "  Fullscreen button    : tick it"
Write-Host "  Mobile friendly      : leave it off. The town wants a landscape window."
Write-Host ""
Write-Host "The upload is about 12 MB and most of it is the two music tracks, so the"
Write-Host "first open takes a few seconds on a cold cache. That is expected."
