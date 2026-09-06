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

## The four tabs

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

## What it is made of

| file | what it does |
| --- | --- |
| `console.mjs` | the local server: model, patch, run |
| `lib/parse.mjs` | a small parser for the literal subset of TypeScript used by the content, with source offsets |
| `lib/content.mjs` | loads and evaluates the content sources |
| `lib/patch.mjs` | writes one value back into a source, with a backup |
| `ui/model.js` | everything derived: conditions in words, the flat number table, the influence links, the tree and its layout |
| `ui/ui.js` | DOM helpers, the staged edit store, the editable fields |
| `ui/app.js` | the four tabs |

The console is a development tool. It is not part of the game build, it ships
nothing into `dist`, and the game does not import a line of it.
