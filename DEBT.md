# Debt review - September 2026

> **Read this as a record, not as a list of open work.** It was written on the
> site repository against V54, it came to the desk with the branch it was
> written on (2026-09-10), and the build has moved a long way since. Two of the
> things it names loudest are already answered: growth compounding at 17 percent
> a year with no ceiling is now `roomFor()` in `simulation.ts`, and the strategy
> it calls optimal, keeping the square unhappy, died with it. T-BAL-1 moved the
> rate the place works things out at and the floor under the long winter, and
> T-PLAY-9 rebalanced every law option. Check any number here against the
> current build before acting on it.

---

Written against `a3fc486` (V54). Everything numeric here came out of the build:
`npx tsc -b`, `npx vitest run`, `npx vite build`, and 36 full reigns through
`tools/reign.ts` (12 seeds x 3 player profiles, with and without `--kingdom`).

> **Where this was written:** on the site repository, whose `deploy.ps1` mirrors
> `..\Lawmaker Dilemmas\{src,tests,tools}` over itself with `robocopy /MIR` on
> every deploy, so a fix made there to `src/` is destroyed by the next one. That
> is why the file asked to be carried to the desk, and this is the copy at the
> desk.

---

## 1. The state of the thing

| Check | Result |
|---|---|
| `tsc -b`, strict, `noUnusedLocals`, `noUnusedParameters` | clean |
| `vitest run` | 264 tests, 20 files, all green, 5.0s |
| `vite build` | 748.93 kB JS (225.63 kB gzip), 70.84 kB CSS |
| `TODO` / `FIXME` / `@ts-ignore` / `eslint-disable` | 1 (one `exhaustive-deps` line) |
| `any` in `src/` | 0 |
| `console.*` in `src/` | 0 |

The engine is in unusually good order. Almost everything below is about the
things *around* it: what the shipped game does not let a player reach, what the
numbers do to each other over twenty years, and what the release path does not
check.

---

## 2. What works, and is worth protecting

**The content validator** (`tests/content.test.ts`, 46 invariants). It asserts
things most projects never write down: every law echoes at least once outside
its own scene; exactly one bad idea per proposal, and its scene is longer than
its siblings'; every layer of the town picture has something that switches it
on; no answer moves more than four boards; no law is a free lunch; no long
dashes. This is the reason the content holds together, and it should be the
first thing any new mechanic gets an entry in.

**The reign simulator** (`tools/reign.ts`). Seven player profiles, headless,
whole reigns, a summary table with endings and lowest boards. Every number in
this document came out of it in under two minutes. Most projects this size have
no balance harness at all.

**Determinism.** `rand01(seed, ...)` everywhere; `truthOf()` recomputes a
trial's truth from the seed so the save file cannot spoil its own ending. That
is a genuinely elegant piece of design.

**The ledger.** Every board movement carries the source that caused it, so a
dial can always answer "why". `noteLine()` even records a year that was spent
and came back with nothing.

**The deploy guard.** Counts `createOscillator` / `createGain` in the shipped
bundle, and checks every media path the build names exists on disk. Written
after a real incident (forty silent builds). Right instinct, and it asserts on
the artefact rather than the intent.

**Chapter fixtures** (`chapters.ts`) - open a legal reign at any stage, with a
test that the engine cannot tell the difference.

**The comments.** They explain *why*, and they are honest about their own
compromises. `works.ts` on the fair already carries the design note for its own
fix.

---

## 3. What does not work mechanically

### 3.1 `rest` eats the year-of-work decision - 60% of all years

Work chosen across 905 years of play (12 seeds x 3 profiles, kingdom open):

| Work | best | comfortable | human | share |
|---|---|---|---|---|
| **rest** | 187 | 209 | 143 | **59.6%** |
| fair | 31 | 35 | 31 | 10.7% |
| everything else (12 buildings) | 105 | 52 | 112 | 29.7% |
| bridge | 1 | 1 | 1 | **0.3%** |
| woodcutter | 0 | 4 | 8 | 1.3% |

Seven in ten years of a reign are spent on the two options that leave nothing
standing. Fourteen buildings, six ground plots, a `road -> bridge` chain, a
placement system and a whole `Works` screen are competing for the remaining 30%.

**Why.** `rest` costs 0 and pays `crownSanity +4, health +2` *immediately*,
every year, forever. Everything else costs 10-14 and pays a trend that takes
years to clear the same bar. Any lookahead - and any player - takes the
immediate one.

**It is not an affordability problem.** I raised the hamlet store lid from 15 to
30 and re-ran: rest stayed at 67% for `best`. The store is not the throttle. The
shape of the payoff is.

**But do not simply nerf it.** I removed rest's reward entirely and re-ran:
`defeat:crownSanity` immediately became the top ending across all three
profiles, final crown fell from 37/57/41 to 7/2/16. **`rest` is currently the
only repair valve the crown has** against `town.crownDrift -1.6/yr` and
`reopen -10`. Price rest only after a second, paid way to keep the crown exists.

### 3.2 Mood -> population -> health: the loop that kills the careful player

The chain, all four links already in the code:

1. Mood is the easiest board to max. Final mood for best / comfortable / human:
   **97 / 99 / 96**, reached by about year 15 and pinned there after.
2. `yearlyChange()`: `rate = 1.03 + (mood - 50) * 0.0028`. At mood 100 that is
   **17% a year, compounding, with no cap** - a doubling every 4.4 years.
3. `crowdingOnHealth()`: `-floor(population / 30)` a year, linear in population.
   Plus `town.crowdEvery` for another `-floor((pop - 100) / 100)` on mood *and*
   health.
4. At 900 souls that is about **-38 health a year**. The best counter in the
   game is `long_room` at level 3: **+6**.

Seed 100, `best`, kingdom open - the last third of the reign:

```
y19  H92  P292      <- healthy, 292 souls
y23  H67  P364
y26  H51  P616
y29  H 7  P913      <- six consecutive years of "nobody at the door"
y31  H 2  P497      ending: spent+crown
```

`best` dies of health in 9 of 12 reigns. With the store lid raised it was 11 of
12. **The optimal strategy is to keep the square unhappy** - the game punishes
you for succeeding at the thing it asks for, and the punishment arrives as
arithmetic no building can answer.

### 3.3 Economy is a floor, not a resource

Lowest board at the end of the reign, 12 of 12 seeds, for `best`,
`comfortable`, `first` and `middle`: **economy**. Final values 10 and 6.

The store's lid is 15 in a hamlet; a work costs 10-14. The key that lifts the
lid (`granary`, +35 cap) earns nothing and carries `trend: economy -1`, so it is
the least attractive purchase on a list you can barely afford one item from.
Consequence: `works.freeAbove: 70` - "economy this high and the surplus pays
half the year" - is **unreachable in every reign I ran**. It is a dead rule.

### 3.4 The whole third stage is switched off in the shipped game

`newGame()` starts with `flags: []`. The kingdom gate at `reducer.ts:855` needs
`kingdom_open`, and the only place that sets it is `chapters.ts` - the dev door
and `?chapter=` on the URL.

So in the game a player actually opens, none of this can be reached:

- `src/engine/world.ts` (430 lines): five neighbours, stances, asks, raids, `tickWorld`
- `src/ui/overlays/World.tsx` (320 lines): the map
- `ForeignState`, `People`, `WorldAsk` in `types.ts`
- `tests/world.test.ts` (278 lines), all passing, all about content nobody sees

This is the largest single piece of finished, tested, unshipped work in the
repo. With `--kingdom` the crown lands in 7 of 12 `best` reigns, so it is not
unreachable by balance - it is unreachable by one missing flag.

### 3.5 The content cliff

Nine proposals, forty-seven cases, all one-shot (`shownCases` blocks repeats).
Once they are spent the scheduler returns `null` and the year is empty. `best`
with the kingdom open averages **5.3 empty years out of 26.9**; seed 100 runs
six in a row (y24-y29). `youngCrown` deliberately keeps a new kingdom alive for
ten more years - with nothing to put in them.

Also dead: `x_flight` is reached by no profile on any of 12 seeds.

### 3.6 Session length

50-70 minutes at 1x with normal reading, in one sitting, on a single save slot
with no migration (§4.7).

---

## 4. Engineering debt

**4.1 No CI, no linter.** No `.github/`, no eslint/prettier/biome config. The
only release path is double-clicking a `.cmd` on Windows.

**4.2 The tests are opt-in at deploy time.** `-Check` is a *flag*. Plain
`deploy.cmd` publishes without running the validator or the 264 tests. The
project's entire quality guarantee is in a suite the release path skips by
default.

**4.3 Zero UI tests.** All 264 tests are engine and content. Roughly 8,000 lines
of TSX - `App.tsx` 1015, `CityScape.tsx` 1965, `town/parts.tsx` 1497 - have no
automated coverage. No jsdom, no testing-library, no vitest `environment`. The
deploy guard checks that `#root` and a JS file exist; a component that throws on
mount ships as a blank page and passes every check.

**4.4 The bundle hash changes on every build with no source change.**
`__BUILD_ID__` is `new Date().toISOString()` evaluated when the config is read,
so it lands in the bundle and moves the content hash. Three builds, no edits:

```
index-DWwOELxk.js   index-CypzTz-C.js   index-VbSLalL_.js
```

Every deploy therefore commits a fresh 749 kB of minified JS into git and
orphans the last one. `.git` is 1.3 MB after seven commits; this is the line
that decides what it is after two hundred.

**4.5 One 749 kB chunk, no code splitting.** Not a single dynamic `import()` in
`src/`. Codex, TechTree, World, Register, the dev panels and the minigames
prototype are all in the first byte the player waits for.

**4.6 No `useMemo`, no `React.memo` anywhere in the UI.** `App()` holds 18
`useState` and 13 `useEffect`; `CityScape` is 1965 lines of SVG under it. Every
one of those state changes re-renders the whole town, including the season wheel
ticking every 6.4s (1.6s at 4x speed). This is the cheapest large win on
mobile.

**4.7 The save is one slot, version-pinned, with no migration.** A save from any
other version returns `null` silently - an hour of play gone with no message.
`saveGame` stringifies the whole state after every dispatch, and `clone()` in
the reducer does `JSON.parse(JSON.stringify(...))` on every action: two full
deep serialisations per click.

**4.8 `MiniApp.tsx` is a 469-line fork of `App.tsx`** over the same engine, kept
in sync by hand, covered by no test, shipped nowhere.

**4.9 Small things.** `reducedMotion()` is duplicated in four files. Two source
files carry a UTF-8 BOM (`src/engine/conditions.ts`, `src/engine/save.ts`) -
in a repo whose deploy script has a dedicated guard against a BOM in the HTML.
`npm run build` writes `dist/`; the published `docs/` is only ever produced from
inside `deploy.ps1`, so there is no way to make the real artefact without
PowerShell.

---

## 5. Backlog, in the order I would do it

### Now - a day's work, and it unblocks the rest

1. **Open the kingdom in a normal reign.** Set `kingdom_open` in `newGame()` (or
   replace the flag with a real condition). One line turns a third of the built
   game on. Run `npm run reign -- --kingdom` first and read §3.5: the empty
   years need filling before this is a gift rather than a chore.
2. **Invert `-Check`.** Run the validator and the tests by default; add
   `-NoCheck` for when you are in a hurry. One `if`.
3. **GitHub Actions on push:** `tsc -b` + `vitest run`. Twenty lines, and the
   first safety net that does not depend on one Windows machine.
4. **`npm run publish`** = `vite build --outDir docs --emptyOutDir` plus the
   trimmings. The path to production should exist outside a `.ps1`.

### The balance block - the real game work

5. **Cap population growth** (logistic curve, or a hard ceiling tied to
   buildings). 17% a year compounding is the root of §3.2, and everything else
   downstream of it is a symptom.
6. **Give the crown a second, paid valve** - a tribute, an envoy, a year of
   receiving people in the hall. Until this exists, `rest` cannot be touched.
7. **Then re-price `rest`:** remove its `once`, or make it diminishing (a second
   rest in a row pays half). Re-run the simulator; aim for rest under 30%.
8. **Make crowding answerable.** Either bend it (sub-linear past a threshold) or
   scale the buildings that fight it with population. `-38` against `+6` is not
   a difficulty curve, it is a wall.
9. **Re-check `works.freeAbove: 70`** once 5-8 land. Either it becomes reachable
   or it should come out.

### Content

10. **A pool of repeatable small scenes for empty years** - or let a subset of
    cases return with different text. Six consecutive "nobody at the door" is
    the worst thing in the seed-100 timeline.
11. **`x_flight`:** find why no reign reaches it (trigger too narrow), or cut it.
12. **The bridge:** 3 picks in 905 years. Give it a reason or retire the
    `road -> bridge` chain.

### Engineering

13. **Take the timestamp out of the hashed bundle** (a meta tag, or its own tiny
    chunk), so an unchanged source builds byte-identical output and a deploy
    with no changes commits nothing.
14. **jsdom + testing-library, 5-10 tests:** every phase mounts without
    throwing. This closes exactly the hole the deploy guard cannot see.
15. **`React.memo` on `CityScape` and `town/parts`, `useMemo` on the derived
    values.** Cheapest large win; most visible on a phone.
16. **Dynamic `import()` for the overlays** (Codex, TechTree, World, Register).
17. **Migrate saves instead of returning `null`,** and tell the player when a
    save cannot be carried forward.
18. **Break up `App.tsx`:** the season wheel and timers into a hook, the overlay
    state into another.
19. **Housekeeping:** strip the two BOMs, hoist `reducedMotion()` into one
    module, and decide whether `MiniApp.tsx` merges or goes.

---

## 6. The one-line version

The engine, the content validator and the balance harness are better than the
game they are serving: a third of the built content is switched off behind one
flag, and of the years a player does get, six in ten are spent on `rest` because
it is the only free thing on a list nobody can afford - while maxed mood
compounds the population into a health drain no building can answer. Fix the
flag, cap the growth, give the crown a paid valve, and only then price the rest.
