# ============================================================================
# ONE COMMAND. Builds this game's page out of the build next door, checks the
# sound is really in it, commits it, pushes it. GitHub Pages serves docs\.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy.ps1
#   ... -m "what changed"    your own commit message
#   ... -NoPush              build and commit, do not push
#   ... -Check               run the content validator and the tests first
#
# The live page updates about a minute after the push. The link never changes.
#
# WHAT THIS DOES NOT TOUCH. The build next door is shared with a second system
# (see ..\Lawmaker Dilemmas\DESK.md, and AGENTS.md beside it). This script only
# READS that folder. Vite is told to write straight into this repo's docs\ with
# --outDir, so neither that folder's own dist\ nor lawmaker-fable.html is
# rewritten by a deploy, and nobody's claim on the bundle is broken.
#
# THE ONE THING THIS SCRIPT EXISTS TO PREVENT: shipping a page that is silent
# for everyone but you. In this game the sound is SYNTHESISED - there is no
# audio\ folder and no .mp3 to forget - so the guard below asserts the
# synthesis is present in the shipped bundle, and ALSO that every media file
# the bundle names is actually on disk under docs\, for the day real audio
# files are added. See "the guard" in README.md.
#
# KEEP THIS FILE PURE ASCII. PowerShell 5.1 reads a .ps1 as ANSI and the path
# to this repo contains Cyrillic ("Google <disk>"): a literal non-ASCII
# character here comes back as mojibake at runtime. Every path derives from
# $PSScriptRoot.
# ============================================================================
param(
  [Alias('m')] [string] $Message = '',
  [switch] $NoPush,
  [switch] $Check
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

function Step($n, $t) { Write-Host ""; Write-Host "[$n] $t" -ForegroundColor Cyan }
function Die($t) { Write-Host ""; Write-Host "STOPPED: $t" -ForegroundColor Red; exit 1 }

$site = Join-Path $root 'docs'

# ---- 0. the build next door ------------------------------------------------
$build = Join-Path $root '..\Lawmaker Dilemmas'
if (-not (Test-Path $build)) {
  Die "the build is not next door.`n         Expected: $build`n         This repo publishes that folder; it is not the game itself."
}
$build = (Resolve-Path -LiteralPath $build).Path
$vite = Join-Path $build 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $vite)) {
  Die "vite is not installed in the build.`n         Run once, in $build :  npm install"
}
if (-not (Test-Path (Join-Path $root '.git'))) { Die "this is not a git repo. Run: git init -b main" }

# ---- 1. the checks, if asked -----------------------------------------------
if ($Check) {
  Step 1 "running the content validator and the tests in the build"
  Push-Location $build
  try {
    & npm run validate
    if ($LASTEXITCODE -ne 0) { Die "npm run validate failed. Nothing was published." }
    & npm test
    if ($LASTEXITCODE -ne 0) { Die "npm test failed. Nothing was published." }
  } finally { Pop-Location }
} else {
  Step 1 "skipping the validator and the tests (pass -Check to run them)"
}

# ---- 2. build --------------------------------------------------------------
# --outDir writes the site into this repo. --emptyOutDir is required because
# that directory is outside vite's root; vite keeps .git and wipes the rest,
# which is why NOTHING but build output may live in docs\. The trimmings that
# belong to the published site are written back in step 3, every time.
Step 2 "building the page from $build"
Push-Location $build
try {
  & node $vite build --outDir $site --emptyOutDir
} finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { Die "vite build failed. Nothing was published." }

# ---- 3. the trimmings ------------------------------------------------------
# .nojekyll   : GitHub Pages otherwise runs Jekyll, which drops _underscored
#               files. Vite emits none today, but this costs one empty file.
# robots.txt  : the repo has to be public for Pages to serve it on a free plan,
#               and this is the part that keeps the page out of search results.
# the meta    : robots.txt is a crawl rule, the meta is an index rule. A page
#               linked from somewhere else can be indexed WITHOUT being
#               crawled, so both are needed to keep the link quiet.
Step 3 "writing .nojekyll, robots.txt and the noindex line"
Set-Content -LiteralPath (Join-Path $site '.nojekyll') -Value '' -NoNewline -Encoding ascii
Set-Content -LiteralPath (Join-Path $site 'robots.txt') -Encoding ascii -Value @'
User-agent: *
Disallow: /
'@
$page = Join-Path $site 'index.html'
$html = Get-Content -LiteralPath $page -Raw -Encoding utf8
if ($html -notmatch 'name="robots"') {
  $html = $html -replace '(?i)<head>', "<head>`r`n    <meta name=`"robots`" content=`"noindex, nofollow`" />"
  Set-Content -LiteralPath $page -Value $html -Encoding utf8 -NoNewline
}

# ---- 4. the guard ----------------------------------------------------------
# Read the built site back and count what is actually in it. Asserting on the
# thing that ships, not on the thing that was meant to ship, is the point.
Step 4 "checking the built page"
$html = Get-Content -LiteralPath $page -Raw -Encoding utf8
if ($html -notmatch 'id="root"') { Die "docs\index.html has no #root. React would have nothing to mount to." }
$bundles = @(Get-ChildItem -LiteralPath (Join-Path $site 'assets') -Filter *.js -ErrorAction SilentlyContinue)
if ($bundles.Count -eq 0) { Die "no javascript bundle under docs\assets. The page would be blank." }
$js = ($bundles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw -Encoding utf8 }) -join "`n"
$mb = [Math]::Round((($bundles | Measure-Object Length -Sum).Sum) / 1MB, 2)

# The sound. Web Audio method names are DOM API calls, so a minifier cannot
# rename them: counting them in the shipped bundle is a real assertion that the
# soundscape travelled, not a hopeful one.
$osc  = ([regex]::Matches($js, 'createOscillator')).Count
$gain = ([regex]::Matches($js, 'createGain')).Count
$actx = ([regex]::Matches($js, 'AudioContext')).Count

# The media files, for the day this game has some. Every path the bundle, the
# stylesheet or the page names must exist on disk under docs\, or the shipped
# page is the silent build: perfect here, mute for everyone else.
$ext = '(?:mp3|ogg|wav|m4a|webm|aac|flac|opus)'
$css = ''
Get-ChildItem -LiteralPath (Join-Path $site 'assets') -Filter *.css -ErrorAction SilentlyContinue | ForEach-Object {
  $css = $css + (Get-Content -LiteralPath $_.FullName -Raw -Encoding utf8)
}
$named = @([regex]::Matches(($js + "`n" + $css + "`n" + $html), '[A-Za-z0-9_./-]+\.' + $ext) | ForEach-Object { $_.Value } | Sort-Object -Unique)
$onDisk = @(Get-ChildItem -LiteralPath $site -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '^\.(mp3|ogg|wav|m4a|webm|aac|flac|opus)$' })
$missing = @()
foreach ($n in $named) {
  $leaf = Split-Path $n -Leaf
  if (-not ($onDisk | Where-Object { $_.Name -eq $leaf })) { $missing += $n }
}

"      bundle    : $mb MB in $($bundles.Count) file(s)"
"      synthesis : $osc oscillators, $gain gains, $actx AudioContext mentions"
"      media     : $($onDisk.Count) file(s) shipped, $($named.Count) named by the build"

if ($missing.Count -gt 0) {
  Die ("the build names audio or media files that are NOT in docs\ :`n         " + ($missing -join "`n         ") + "`n         This page would be SILENT for every player but you. Nothing was pushed.")
}
if ($onDisk.Count -eq 0 -and ($osc -lt 1 -or $gain -lt 3)) {
  Die "no synthesised sound in the bundle ($osc oscillators, $gain gains) and no audio files either.`n         The page would be SILENT. Nothing was pushed."
}

# ---- 5. commit -------------------------------------------------------------
Step 5 "committing"
$sweep = & git status --porcelain
if ($sweep) {
  "      this commit will contain:"
  foreach ($line in $sweep) { "        $line" }
}
& git add -A
$dirty = & git status --porcelain
if (-not $dirty) {
  "      nothing changed, keeping the last commit"
} else {
  if (-not $Message) { $Message = "deploy: rebuild the page ({0})" -f (Get-Date -Format 'yyyy-MM-dd HH:mm') }
  & git commit -q -m $Message
  if ($LASTEXITCODE -ne 0) { Die "git commit failed" }
  "      " + (& git log --oneline -1)
}

# ---- 6. push ---------------------------------------------------------------
# `git remote get-url` on a missing remote writes to stderr, and PowerShell 5.1
# turns a native command's stderr into a terminating error under
# ErrorActionPreference Stop. Ask the question that cannot fail instead.
$remote = ''
if ((& git remote) -contains 'origin') { $remote = (& git remote get-url origin) }
if (-not $remote) {
  Write-Host ""
  Write-Host "NO REMOTE YET. Four steps, once ever:" -ForegroundColor Yellow
  Write-Host "  1. github.com/new  ->  name it lawmaker-fable  ->  Public  ->  no README"
  Write-Host "  2. git remote add origin https://github.com/<you>/lawmaker-fable.git"
  Write-Host "  3. git push -u origin main"
  Write-Host "  4. Settings -> Pages -> Deploy from a branch -> main / docs -> Save"
  exit 0
}

if ($NoPush) { Step 6 "committed, not pushed (-NoPush)"; exit 0 }

Step 6 "pushing"
& git push -q -u origin HEAD
if ($LASTEXITCODE -ne 0) { Die "git push failed. If it asks for a password, GitHub wants a personal access token, not the account password." }

# https://github.com/<user>/<repo>.git  ->  https://<user>.github.io/<repo>/
if ($remote -match 'github\.com[:/]([^/]+)/([^/.]+)') {
  $url = "https://{0}.github.io/{1}/" -f $matches[1], $matches[2]
  Write-Host ""
  Write-Host "LIVE IN ABOUT A MINUTE: $url" -ForegroundColor Green
  Write-Host "(hard-refresh with Ctrl+F5 if you still see the old one)"
}
