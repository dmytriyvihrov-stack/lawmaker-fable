# Lawmaker Fable - the published page

This repository is **not the game**. It is the thing that puts the game on a
link. The game itself lives next door, in `..\Lawmaker Dilemmas\`, which has no
git in it and is shared with a second system (Codex). Nothing here writes into
that folder.

One command builds the page out of the build next door, checks the sound is
really in it, commits it and pushes it:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy.ps1
```

The live page updates about a minute later. **The link never changes.**

| Flag | What it does |
|---|---|
| `-m "what changed"` | your own commit message instead of the dated default |
| `-NoPush` | build and commit, do not push |
| `-Check` | run `npm run validate` and `npm test` in the build first, and refuse to publish if either fails |

## What is in here

| Path | What |
|---|---|
| `docs/` | the published site. **Every file in it is generated.** Do not edit anything here by hand; the next deploy wipes it. |
| `deploy.ps1` | the one command above |
| `README.md` | this page |

`docs/` is where GitHub Pages is pointed: *Settings -> Pages -> Deploy from a
branch -> `main` / `docs`*. That was set once and does not need touching again.

## How it works

`deploy.ps1` runs vite in the build next door with `--outDir` aimed straight at
this repo's `docs/`. That matters for two reasons:

- the build's own `dist/` and `lawmaker-fable.html` are never rewritten by a
  deploy, so a deploy can never collide with whoever holds the bundle in
  `..\Lawmaker Dilemmas\DESK.md`;
- the site is a **real static site**, not the single inlined file. The single
  file (`lawmaker-fable.html`, made by `npm run bundle`) carries only the
  stylesheet and the script inside it. A site directory carries whatever else
  the build emits as well - fonts, pictures, audio - each as its own file with
  its own URL. That is the format that keeps working the day this game stops
  synthesising its sound and starts loading it.

`--emptyOutDir` is what lets vite write outside its own root. It keeps `.git`
and wipes everything else in `docs/`, which is the whole reason nothing but
build output may live there. `.nojekyll`, `robots.txt` and the `noindex` line
are written back in after every build, by the script, on purpose.

## The guard

The sister project (`Battle rothers + taletop`) once shipped a page that was
perfect at this desk and **silent for every playtester**, because the audio
lived in a folder the host did not have. It went unnoticed for forty builds.
`deploy.ps1` reads the built page back and refuses to push if:

- there is no `#root` in `docs/index.html`, or no javascript under
  `docs/assets/` - the page would be blank;
- the bundle names an audio or media file (`.mp3 .ogg .wav .m4a .webm .aac
  .flac .opus`) that is **not on disk under `docs/`** - the page would be
  silent for everyone but you;
- there is neither synthesised sound in the bundle nor a single audio file -
  the sound went missing entirely.

Today this game's sound is synthesised in `src/ui/audio/synthesis.ts`: there is
no audio file in the project at all, and the guard counts the Web Audio calls
(`createOscillator`, `createGain`) in the shipped bundle instead. Those are DOM
API names, so no minifier can rename them and the count is a real assertion.
The day real audio files appear, the first rule above starts doing the work and
no change to this script is needed.

One thing the guard cannot check, because it is not a property of the file: a
browser will not start an `AudioContext` until the player has clicked
something. The game already waits for that. If the page seems silent, click it
once before believing the guard was wrong.

## The link is public, and quiet

GitHub Pages only serves a **public** repository on a free plan, so this repo is
public. Two things keep the page from being found by accident:

- `docs/robots.txt` disallows every crawler;
- `docs/index.html` carries `<meta name="robots" content="noindex, nofollow">`.

Both are needed: `robots.txt` stops the crawl, the meta stops the indexing of a
page someone else linked to.

What that does **not** do is hide the repository. A public repo is listed on the
GitHub profile that owns it, and anyone who opens the page can read the game's
javascript - that is true of every web game. If the game ever needs a real
lock - a password, a list of who may open it - the answer is a host with access
control in front of it (Cloudflare Pages has one on its free plan), not
GitHub Pages.
