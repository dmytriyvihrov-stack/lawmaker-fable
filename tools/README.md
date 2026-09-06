# Lawmaker design console

A local page for reading and tuning the game content: how the four boards move
each other, what every law and every case triggers, what it costs, and what it
unlocks next. It reads the TypeScript sources directly and writes single values
back into them.

```bash
node tools/console.mjs
```

Then open http://localhost:5180 (the command opens it for you; pass `--no-open`
to stop that, and `--port 5199` to move it).

No build step and no dependencies: plain Node, plain browser modules.

## The five tabs

**Rates.** The four boards side by side (how many numbers touch each one, how
much they add up to, what drifts every turn), a wheel and a matrix of how a
board reaches another board, a table of *every* number in the game with filters,
the engine dials from `src/engine/config.ts`, the town readings per band, and
the monarch traits that bend the arithmetic. Nothing in the engine lets one
board change another directly: a board opens a gate (a stat threshold inside a
trigger), the gate lets an event in, and the answers to that event move other
boards. The wheel draws exactly those paths; click an arrow or a matrix cell to
read them one by one.

**Laws.** Every proposal: which act it belongs to, which advisor brings it, what
opens it, the three answers with their tags, their effects on seal, their per
turn drift, their city layers and the scene the town reads back. Under each
option, a list of everything that law puts on the table later: the cases it
opens, the proposals it unlocks, the loops it arms, the rulings it grants at the
bench, the exceptions that can be made to it.

**Cases.** Every case: the trigger in plain words and as raw data, the priority
(and whether it jumps the queue), the scene, every answer with its effects,
flags, exceptions, decrees, repeals and delayed consequences, plus the ruling
grammar of the bench and where the case sits in the chain.

**Reign.** Whole reigns played through the real engine, with seven kinds of
player, a table over the seeds and a year by year timeline for each run. Its own
section below. Nothing on this tab writes anything.

**Tree.** The whole dependency graph, left to right: proposals, law options,
cases, story flags and loops, with the edges that connect them (opens, blocks,
sets, schedules, decrees, repeals, arms, fires). Drag to pan, wheel to zoom,
`fit` and `100%` to reset. Clicking a box dims everything it is not connected to
and opens the full editor for it on the right.

## Editing

Every white box is editable. Changes are staged, not written: the header counts
them, `Save to files` (or Ctrl+S) writes them, `Discard` drops them.

A save rewrites only the range of each value that changed, so comments,
formatting and everything else in the file survive untouched. The previous
version of every file it writes is copied into `tools/.backups` first.

- A number box left empty removes that key (for example an effect on a board).
- Typing into an empty effect box adds the key, creating the object if needed.
- `Run validate` and `Run tests` run `npm run validate` and `npm test` and show
  the output at the top of the page, so a tuning pass can be checked without
  leaving the console.

The console writes to `src/content/*` and `src/engine/config.ts` only.

Two values on the Tree tab are worth a word: the loop timings in
`src/content/loops.ts` are written as references to `CONFIG`, so editing them
there would replace the reference with a literal. Edit the loop numbers on the
Rates tab instead, under the engine dials.

## The reign simulator

The second tool here, and the one to reach for after a balance edit. It plays
whole reigns through the real engine, no browser and no guessing, and says what
happened. It has a page and a command line, and they are the same thing.

**The page**: start the console and open the **Reign** tab. Tick the players,
say how many seeds, press `Play these reigns`. Nothing on that tab writes
anything.

**The command line**, when a script needs it:

```bash
npm run reign                                      # every player, seeds 1-12
npm run reign -- --player best --seed 100          # one reign, year by year
npm run reign -- --player comfortable --seeds 30
npm run reign -- --player best --seeds 5-20 --moments none --speed 4
```

Seven players. Three of them think:

| player | what it does |
| --- | --- |
| `best` | the most efficient. Every answer is tried on a copy of the state through the reducer itself, and the one that leaves the boards most level is kept. |
| `comfortable` | the kindest answer, every time. It reads how the place lives (mood, health, who is still standing there) and what the answer does to the person in front of you, and it never counts the cost to the crown, because paying that cost yourself is what the kind answer is. |
| `human` | `best` with a share of wrong answers, `--mistake 0.3`. Errors and human decisions. |

And four that do not: `random` draws from a hat, and `first`, `middle` and
`last` are the golden runs from `tests/playthrough.test.ts`.

The two opinions in the whole file are `balanceScore` and `kindScore` at the
top of `reign.ts`, plus `choiceKindness`, which reads the three things that
always mean the kind answer: who lives, whether the sentence is a conviction,
and whether the answer bends a law of yours for the person standing there.
Nothing in the content marks an answer as kind, so if that ever changes, that
function is where it goes.

The small things on the map are taken in autumn by `--moments all|half|none`,
and each player has its own default, so `comfortable` stops for all of them and
the golden three for none.

**Reading the timeline.** A year is marked `!` when a scene from the urgent band
came up and `.` when nobody came at all. The columns are the boards (C crown,
M mood, H health, E store, W watch, K culture) and P the count of souls, read at
the year of work. The table averages over the seeds and names the endings, the
board that went lowest, and an estimate of minutes at the table: the season
wheel from `CONFIG.idle` at `--speed`, plus a reading budget per card that
`--read` scales. Scenes that never came up in any of the reigns are listed at
the end, which is how content nothing can reach shows itself.

**The way to use it on a balance change** is to run it, make the change, and run
it again with the same seeds. Two tables side by side say what the change did to
a reign, which is a different question from whether the tests still pass.

It runs on `vite-node`, which vitest already brings, so nothing is installed.
The console spawns it as a child process and draws the JSON it prints
(`--json`), so a simulator that hangs cannot take the console with it.

## When the console opens empty

It did, for a while, and the reason is worth knowing because it will happen
again: this tool reads the content sources with its own small parser, and the
content moves faster than the tool does.

Three things were fixed on 2026-09-06 and all three are the same shape.

- `src/content/loops.ts` no longer exists. A source is `optional: true` now and
  reads as nothing.
- `FLOURISHES` and `IVA_MET` are no longer exported. A name that is not there
  reads as nothing too, instead of throwing.
- `CONFIG` contains `speeds: [1, 2, 4] as const`, and the parser had never seen
  a type assertion. It gave up on the whole declaration, `parseModule` returned
  an empty map, and every tab that reads a number drew nothing. The parser skips
  an assertion now.

What each of those was hiding behind was one silent `catch`. It is not silent
any more: `PARSE_DEBUG=1 node tools/console.mjs` says which declaration was
dropped and why. Everything the console could not find is collected in
`missing` and comes back with the model.

So if a tab is empty, run the console with `PARSE_DEBUG=1` before believing the
page is broken.

## What it is made of

| file | what it does |
| --- | --- |
| `console.mjs` | the local server: model, patch, run |
| `reign.ts` | the reign simulator: seven players, run by the Reign tab and by npm run reign |
| `lib/parse.mjs` | a small parser for the literal subset of TypeScript used by the content, with source offsets |
| `lib/content.mjs` | loads and evaluates the content sources |
| `lib/patch.mjs` | writes one value back into a source, with a backup |
| `ui/model.js` | everything derived: conditions in words, the flat number table, the influence links, the tree and its layout |
| `ui/ui.js` | DOM helpers, the staged edit store, the editable fields |
| `ui/app.js` | the four tabs |

The console is a development tool. It is not part of the game build, it ships
nothing into `dist`, and the game does not import a line of it.
