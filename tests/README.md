# The tests

Run everything: `npm test`. The validator alone, the fastest signal:
`npm run validate`. One file: `npx vitest run tests/wolf.test.ts`. One test:
`npx vitest run tests/wolf.test.ts -t "eating it"`.

Every test drives the real engine and the real content; there are no fixture
content sets. A state is built one of three ways: `newGame(seed)` and patch
the fields you need; `beginAt(stage, seed)` from `src/engine/chapters.ts` for
a legal town or kingdom; or the helpers in `tests/helpers.ts`, which are the
first way with a name on it. Components are rendered through
`react-dom/server` (`mount.test.tsx`, `town-life.test.ts`), never mounted.

The validator's checks carry numbers, and the numbers are referenced from the
documents (check 17b, check 35). A number is never reused: a new check takes
the next free number and goes at the end of its describe.

| File | What it holds | Starts from |
|---|---|---|
| `content.test.ts` | the validator: 39 numbered checks (1 to 36, plus 4b, 17b, 25b) on the content tables; 7 on the people in the picture; 3 on seasons, ages and the reckoning | the content tables, no reign |
| `smoke.test.ts` | config sanity, a new game, works offered by stage, the monarch off the seed, the bench parser | `newGame` |
| `engine.test.ts` | the hamlet's boards, buildings, the ledger, trends, the long winter, the seasons, the charter, the year of work, the pot, reopening a law | `newGame` on a year |
| `playthrough.test.ts` | golden runs: fixed pickers driven to the portrait; laws before cases, the closed hamlet, the long winter | `play(seed, pick)` |
| `first-year.test.ts` | the first year: no law, a choice of two works | `chooseDeclared(newGame)` |
| `chapters.test.ts` | `beginAt()`: a legal state at every stage, played on | `beginAt` |
| `against.test.ts` | a plain bench word under a standing law: breaks, bends, the rope from two benches | `newGame` with `v1_idle_hand` on the table |
| `returning.test.ts` | the people who come back (Tam, Marta, the second wave), `{{ago}}` | `newGame` with a log line |
| `trial.test.ts` | the bench, blind: the truth off the seed, the wrong conviction | `newGame` with `tr_accused` |
| `wolf.test.ts` | the wolf and its litter, the rope at the crossroads, what animals cost every year | `newGame` with `w_wolf` |
| `herd-and-founding.test.ts` | the herd on the common; the founding five | `newGame` with `w_goats` |
| `winter-and-square.test.ts` | the long winter and the store; the deputation and the walk-out; the brother; the idle hand | `newGame` on a year with a population |
| `bonds-and-ground.test.ts` | bonds (five rungs, gifts, the one you take), plots, the growth ladder, who can be taken | `newGame` with a granary |
| `epithet.test.ts` | the epithet, the monarch's age, naming the place, the ladder | `newGame` |
| `moments.test.ts` | the small things on the map; every case has a spot | `newGame` on a year |
| `city-layers.test.ts` | rulings put layers on the town, and the layers are in the save | `newGame` plus laws |
| `world.test.ts` | the kingdom: the world off the seed, the neighbours, a year abroad, the crown | `beginAt('kingdom')` |
| `hand.test.ts` | the minigame layer: an act for every answer, the gestures frame by frame | scene fixtures, no reign |
| `journey.test.ts` | the walking ruler: callers, errands, the round of jobs, route geometry against the river | `newJourney`, `route` |
| `town-life.test.ts` | which bank a thing is on, the way over the water, what the picture puts on the ground in each reign | `beginAt('town')` rendered |
| `map-box.test.ts` | the fit of the town box on every window; what the camera has to hold | `fitOf` |
| `mount.test.tsx` | every screen renders at every stage | `beginAt` at three stages, rendered |
| `sound.test.ts` | six minutes of the ambience against a mocked AudioContext: nothing periodic | `audioMock` |
| `dev-dials.test.ts` | the dev dials move a board through the ledger | `newGame` |
| `dev-edits.test.ts` | the pending text edits store | the store |
| `dev-marks.test.ts` | the thumbs and notes a run leaves | the store |

The slow ones, and why: `journey.test.ts` walks routes against the river point
by point and is most of the suite on its own; `town-life.test.ts` does the same
over a rendered town; `mount.test.tsx` draws the town twelve times. Most of the
rest play whole years through the reducer and take a second or two, so time one
file before believing it is slow.
