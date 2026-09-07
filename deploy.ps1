# ============================================================================
# ONE COMMAND. Refreshes this repo's copy of the game from the desk next door,
# builds the page out of THIS repo, checks the sound is really in it, commits
# it and pushes it. GitHub Pages serves docs\.
#
#   deploy.cmd                     <- double click this, it calls the line below
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy.ps1
#
#   ... -m "what changed"    your own commit message
#   ... -NoSync              do not refresh the source, publish what is here
#   ... -NoPush              build and commit, do not push
#   ... -NoCheck             publish without the validator and the tests
#                            (they run on every deploy otherwise)
#
# The live page updates about a minute after the push. The link never changes.
#
# THIS REPO STANDS ON ITS OWN. It carries the whole game - src\, tests\, the
# vite and typescript configuration, the lockfile - and builds with its own
# node_modules. Clone it on a bare machine, run npm install, and it builds. The
# desk next door is only where the source is COPIED FROM, and only if it
# happens to be there.
#
# BUT IT IS NOT WHERE YOU EDIT. Step 1 mirrors ..\Lawmaker Dilemmas\src over
# this repo's src on every deploy, so anything changed here is destroyed the
# next time this script runs. Edit at the desk, deploy from here. Nothing in
# this script ever writes back into the desk.
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
  [switch] $NoSync,
  [switch] $NoPush,
  # The validator and the tests run on every deploy. They used to be opt-in
  # behind -Check, which meant the plain double-click published without the
  # 46 content checks and the whole suite: the one quality guarantee this
  # project has, skipped by the only release path it has. -NoCheck is the
  # escape hatch for when you know what you are doing and are in a hurry.
  [switch] $NoCheck,
  # Accepted and ignored, so an old habit or an old note still works.
  [switch] $Check
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

function Step($n, $t) { Write-Host ""; Write-Host "[$n] $t" -ForegroundColor Cyan }
function Die($t) { Write-Host ""; Write-Host "STOPPED: $t" -ForegroundColor Red; exit 1 }

$site = Join-Path $root 'docs'
if (-not (Test-Path (Join-Path $root '.git'))) { Die "this is not a git repo. Run: git init -b main" }

# ---- 1. the source ---------------------------------------------------------
# One direction only: the desk is read, this repo is written. Robocopy /MIR
# also DELETES files here that are gone there, which is what keeps a renamed
# or removed module from living on in the published build.
$desk = Join-Path $root '..\Lawmaker Dilemmas'
if ($NoSync) {
  Step 1 "not syncing (-NoSync): publishing the copy already in this repo"
} elseif (-not (Test-Path $desk)) {
  Step 1 "the desk is not next door, publishing this repo's own copy"
  "      (looked for $desk - that is fine, this repo builds without it)"
} else {
  $desk = (Resolve-Path -LiteralPath $desk).Path
  Step 1 "refreshing the source from $desk"
  foreach ($dir in @('src', 'tests', 'tools')) {
    $from = Join-Path $desk $dir
    if (-not (Test-Path $from)) { continue }
    & robocopy $from (Join-Path $root $dir) /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
    # Robocopy says 0-7 for success and 8 and up for failure. Anything else
    # would leave a half-copied tree, which must never reach a build.
    if ($LASTEXITCODE -ge 8) { Die "robocopy failed on $dir (exit $LASTEXITCODE). Nothing was published." }
  }
  $files = @('index.html', 'package.json', 'package-lock.json', 'vite.config.ts',
    'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'bundle.mjs',
    'minigames.html', 'vite.minigames.config.ts', 'bundle-minigames.mjs', 'dev-server.mjs')
  foreach ($f in $files) {
    $from = Join-Path $desk $f
    if (Test-Path $from) { Copy-Item -LiteralPath $from -Destination (Join-Path $root $f) -Force }
  }
  "      src, tests, tools and the build configuration are now the desk's"
}
if (-not (Test-Path (Join-Path $root 'src'))) { Die "there is no src\ in this repo and no desk to copy one from." }

# ---- 2. the dependencies ---------------------------------------------------
# This repo installs its own. That is the whole of what "independent" means
# here: the build does not reach into another folder's node_modules.
$vite = Join-Path $root 'node_modules\vite\bin\vite.js'
$stamp = Join-Path $root 'node_modules\.lock-stamp'
$lock = Join-Path $root 'package-lock.json'
$lockHash = (Get-FileHash -LiteralPath $lock -Algorithm SHA256).Hash
$installed = ''
if (Test-Path $stamp) { $installed = (Get-Content -LiteralPath $stamp -Raw).Trim() }
if (-not (Test-Path $vite) -or $installed -ne $lockHash) {
  Step 2 "installing the dependencies (first run, or the lockfile moved - this is the slow one)"
  & npm ci
  if ($LASTEXITCODE -ne 0) { Die "npm ci failed. Nothing was published." }
  Set-Content -LiteralPath $stamp -Value $lockHash -Encoding ascii
} else {
  Step 2 "dependencies are current"
}

# ---- 3. the checks, if asked -----------------------------------------------
if ($NoCheck) {
  Step 3 "skipping the validator and the tests, because -NoCheck was asked for"
} else {
  Step 3 "running the content validator and the tests on the copy that is about to ship"
  & npm run validate
  if ($LASTEXITCODE -ne 0) { Die "npm run validate failed. Nothing was published." }
  & npm test
  if ($LASTEXITCODE -ne 0) { Die "npm test failed. Nothing was published." }
}

# ---- 4. build --------------------------------------------------------------
# Built from THIS repo's source, into this repo's docs\, so what is published
# is what a visitor to the repository can read. Vite empties docs\ first, which
# is why nothing but build output may live there; the trimmings that belong to
# the published site are written back in step 5, every time.
Step 4 "building the page"
& node $vite build --outDir $site --emptyOutDir
if ($LASTEXITCODE -ne 0) { Die "vite build failed. Nothing was published." }

# ---- 5. the trimmings ------------------------------------------------------
# .nojekyll   : GitHub Pages otherwise runs Jekyll, which drops _underscored
#               files. Vite emits none today, but this costs one empty file.
# robots.txt  : the repo has to be public for Pages to serve it on a free plan,
#               and this is the part that keeps the page out of search results.
# the meta    : robots.txt is a crawl rule, the meta is an index rule. A page
#               linked from somewhere else can be indexed WITHOUT being
#               crawled, so both are needed to keep the link quiet.
Step 5 "writing .nojekyll, robots.txt and the noindex line"
Set-Content -LiteralPath (Join-Path $site '.nojekyll') -Value '' -NoNewline -Encoding ascii
Set-Content -LiteralPath (Join-Path $site 'robots.txt') -Encoding ascii -Value @'
User-agent: *
Disallow: /
'@
$page = Join-Path $site 'index.html'
$html = [System.IO.File]::ReadAllText($page)
if ($html -notmatch 'name="robots"') {
  # AFTER the charset line, never before it: a charset declaration only counts
  # when it is the first thing in the head. And written back through
  # UTF8Encoding($false), because PowerShell 5.1's -Encoding utf8 puts a BOM in
  # front of the doctype.
  $meta = '<meta name="robots" content="noindex, nofollow" />'
  if ($html -match '(?i)<meta\s+charset[^>]*>') {
    $html = $html -replace '(?i)(<meta\s+charset[^>]*>)', ("`$1`r`n    " + $meta)
  } elseif ($html -match '(?i)</head>') {
    $html = $html -replace '(?i)</head>', ("  " + $meta + "`r`n  </head>")
  } else {
    Die "docs\index.html has neither a charset meta nor a </head>. There is nowhere to put the noindex line."
  }
  [System.IO.File]::WriteAllText($page, $html, (New-Object System.Text.UTF8Encoding($false)))
}

# ---- 6. the guard ----------------------------------------------------------
# Read the built site back and count what is actually in it. Asserting on the
# thing that ships, not on the thing that was meant to ship, is the point.
Step 6 "checking the built page"
$html = [System.IO.File]::ReadAllText($page)
if ($html -notmatch 'id="root"') { Die "docs\index.html has no #root. React would have nothing to mount to." }
if ($html -notmatch 'name="robots"') { Die "docs\index.html lost the noindex line. The page would be indexable." }
# The build number lives in the page and not in the bundle, so that an
# unchanged source tree builds byte-identical JavaScript and a deploy with no
# changes commits nothing. If the transform in vite.config.ts ever breaks, the
# badge in the corner quietly reads "dev" and a shared link can no longer be
# checked against what is running - so it is asserted on the shipped page.
if ($html -notmatch 'name="lawmaker-build"') { Die "docs\index.html has no build tag. The corner badge would read 'dev' and nobody could tell what is live." }
if ($html[0] -eq [char]0xFEFF) { Die "docs\index.html starts with a byte order mark. Write it with UTF8Encoding(`$false)." }
$bundles = @(Get-ChildItem -LiteralPath (Join-Path $site 'assets') -Filter *.js -ErrorAction SilentlyContinue)
if ($bundles.Count -eq 0) { Die "no javascript bundle under docs\assets. The page would be blank." }
$js = ($bundles | ForEach-Object { [System.IO.File]::ReadAllText($_.FullName) }) -join "`n"
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
  $css = $css + [System.IO.File]::ReadAllText($_.FullName)
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

# ---- 7. commit -------------------------------------------------------------
Step 7 "committing"
$sweep = & git status --porcelain
if ($sweep) {
  $n = ($sweep | Measure-Object).Count
  "      $n path(s) changed:"
  foreach ($line in ($sweep | Select-Object -First 12)) { "        $line" }
  if ($n -gt 12) { "        ... and " + ($n - 12) + " more" }
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

# ---- 8. push ---------------------------------------------------------------
# `git remote get-url` on a missing remote writes to stderr, and PowerShell 5.1
# turns a native command's stderr into a terminating error under
# ErrorActionPreference Stop. Ask the question that cannot fail instead.
$remote = ''
if ((& git remote) -contains 'origin') { $remote = (& git remote get-url origin) }
if (-not $remote) {
  Write-Host ""
  Write-Host "NO REMOTE YET. Three steps, once ever:" -ForegroundColor Yellow
  Write-Host "  1. git remote add origin https://github.com/<you>/lawmaker-fable.git"
  Write-Host "  2. git push -u origin main"
  Write-Host "  3. Settings -> Pages -> Deploy from a branch -> main / docs -> Save"
  exit 0
}

if ($NoPush) { Step 8 "committed, not pushed (-NoPush)"; exit 0 }

Step 8 "pushing"
& git push -q -u origin HEAD
if ($LASTEXITCODE -ne 0) { Die "git push failed. If it asks for a password, GitHub wants a personal access token, not the account password." }

# https://github.com/<user>/<repo>.git  ->  https://<user>.github.io/<repo>/
if ($remote -match 'github\.com[:/]([^/]+)/([^/.]+)') {
  $url = "https://{0}.github.io/{1}/" -f $matches[1], $matches[2]
  Write-Host ""
  Write-Host "LIVE IN ABOUT A MINUTE: $url" -ForegroundColor Green
  Write-Host "(hard-refresh with Ctrl+F5 if you still see the old one)"
}
