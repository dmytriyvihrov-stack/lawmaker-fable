# Lawmaker Fable

A small game about writing law for a place that is still too small to need it.
Five people, one field, and a seal. Play it here:

**https://dmytriyvihrov-stack.github.io/lawmaker-fable/**

## Deploying it

Double click **`deploy.cmd`**. That is the whole thing: it refreshes the source
from the desk next door, installs anything missing, builds the page, refuses to
publish it if the sound did not travel, commits and pushes. The live page
updates about a minute later, and **the link never changes**.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy.ps1
```

| Flag | What it does |
|---|---|
| `-m "what changed"` | your own commit message instead of the dated default |
| `-Check` | run the content validator and the tests first, and refuse to publish if either fails |
| `-NoSync` | do not refresh the source; publish exactly what is in this repo |
| `-NoPush` | build and commit, do not push |

## This repo stands on its own

It carries the whole game: `src/`, `tests/`, `tools/`, the vite and typescript
configuration and the lockfile. It installs its own `node_modules` and builds
with them. Clone it onto a machine that has never seen anything else of this
project, run `npm install`, and it builds.

It is also **completely separate from every other game in this account** - its
own repository, its own history, its own link. Nothing here ever pushes
anywhere else.

## But it is not where you edit

The game is worked on at the desk in `..\Lawmaker Dilemmas\`, which two systems
share (see `AGENTS.md` and `DESK.md` there). Step 1 of every deploy mirrors that
folder's `src`, `tests` and `tools` over this repo's, deletions included, so
**anything edited here is destroyed by the next deploy**. Edit at the desk,
deploy from here. Nothing in this script ever writes back into the desk - it is
read, never touched, and no build of it is disturbed.

If the desk is not there at all, the deploy says so and publishes this repo's
own copy. That is the independence working, not a failure.

| Path | What |
|---|---|
| `deploy.cmd`, `deploy.ps1` | the one command |
| `src/`, `tests/`, `tools/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `package*.json` | the game, mirrored from the desk on every deploy |
| `docs/` | the published site. **Every file in it is generated.** Editing anything here is pointless; the next build wipes the folder. |

`docs/` is where GitHub Pages is pointed: *Settings -> Pages -> Deploy from a
branch -> `main` / `docs`*. Set once, never touched again.

## The sound, and the guard

The sister project in this account once shipped a page that was perfect at the
desk and **silent for every playtester**, because the audio lived in a folder
the host did not have. It went unnoticed for forty builds. That is what the
guard in `deploy.ps1` is for. It reads the built page back and refuses to push
if:

- there is no `#root` in `docs/index.html`, or no javascript under
  `docs/assets/` - the page would be blank;
- the bundle names an audio or media file (`.mp3 .ogg .wav .m4a .webm .aac
  .flac .opus`) that is **not on disk under `docs/`** - the page would be
  silent for everyone but you;
- there is neither synthesised sound in the bundle nor a single audio file -
  the sound went missing entirely.

Most of the sound has no audio file at all: it is synthesised in
`src/ui/audio/synthesis.ts` and `src/ui/music.ts`'s fallback pad, and the
guard counts the Web Audio calls (`createOscillator`, `createGain`) in the
shipped bundle. Those are DOM API names, so no minifier can rename them and
the count is a real assertion.

The music behind the toggle can also be one or two recorded tracks, when
`assets/music/*.mp3` has anything in it. They do not travel as their own
files under `docs/`: `deploy.ps1` reads them, base64 encodes them and sews a
`window.__lawmakerMusic` script into `docs/index.html` directly, the same way
`bundle.mjs` does for the single inlined `lawmaker-fable.html`. That is why
the media-file rule above only ever fires on a literal path (an `<img>`, a
future `<audio src>`) and not on a recorded track: a data URI names nothing
on disk to go missing. A track that IS meant to be there and is not gets its
own check, right after the guard's build-tag assertion, on
`window.__lawmakerMusic` itself.

One thing the guard cannot check, because it is not a property of a file: a
browser will not start an `AudioContext` until the player has clicked
something. The game already waits for that gesture. If the page seems silent,
click it once before believing the guard was wrong.

## The link is public, and quiet

GitHub Pages only serves a **public** repository on a free plan, so this repo is
public. Two things keep the page from being found by accident:

- `docs/robots.txt` disallows every crawler;
- `docs/index.html` carries `<meta name="robots" content="noindex, nofollow">`.

Both are needed: `robots.txt` stops the crawl, the meta stops the indexing of a
page someone else has linked to. Share the link and it works; nobody finds it by
searching.

What that does **not** do is hide the repository. A public repo is listed on the
profile that owns it, and its source can be read by anyone who opens it. If the
game ever needs a real lock - a password, a list of who may open it - that means
a host with access control in front of it, not GitHub Pages.
