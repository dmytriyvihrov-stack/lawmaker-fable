import { useState } from 'react';
import { STATS } from '../../content/meta';
import { PORTRAIT_UI } from '../../content/portrait-text';
import { UI } from '../../content/ui-strings';
import { offerFile, type Offer } from '../offer-file';
import { CONFIG } from '../../engine/config';
import { monarchAge, monarchOf } from '../../engine/monarch';
import { epithetOf } from '../../engine/epithet';
import { computePortrait } from '../../engine/portrait';
import { MonarchPortrait } from '../components/MonarchPortrait';
import { FolkIcon } from '../components/Folk';
import { PLACING_LINES, SCORE_UI, YOU_LOOK } from '../../content/scoreboard';
import { foundingLooks } from '../../engine/folk';
import { placing, reignScore, scoreboard } from '../../engine/score';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  onBeginAnew: () => void;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text: string, perLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) line = word;
    else if (line.length + word.length + 1 <= perLine) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildShareSvg(state: GameState): string {
  const p = computePortrait(state);
  const W = 1080;
  const H = 1350;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
  );
  parts.push(`<rect width="${W}" height="${H}" fill="#14110d"/>`);
  parts.push(
    `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#3a3128" stroke-width="4"/>`,
  );
  const F = 'font-family="Georgia, system-ui, serif"';
  let y = 170;
  parts.push(
    `<text x="90" y="${y}" ${F} font-size="34" fill="#b6a683" letter-spacing="6">${escapeXml(
      UI.title.name.toUpperCase(),
    )}</text>`,
  );
  // Who you were and where. Both of these belong at the top, under the title:
  // the foot of the card is stat bars from H-300 down and has no room left.
  if (state.townName) {
    y += 50;
    parts.push(
      `<text x="90" y="${y}" ${F} font-size="40" fill="#e9dcbe">${escapeXml(state.townName)}</text>`,
    );
  }
  const named = epithetOf(state);
  if (named) {
    y += 46;
    parts.push(
      `<text x="90" y="${y}" ${F} font-size="32" fill="#c8543f">${escapeXml(
        UI.epithet.calledYou.replace('{name}', named.name),
      )}</text>`,
    );
  }

  y += 90;
  for (const line of wrap(p.headline, 34)) {
    parts.push(`<text x="90" y="${y}" ${F} font-size="52" fill="#e9dcbe">${escapeXml(line)}</text>`);
    y += 66;
  }
  y += 24;
  for (const line of wrap(p.description, 46)) {
    parts.push(`<text x="90" y="${y}" ${F} font-size="32" fill="#b6a683">${escapeXml(line)}</text>`);
    y += 46;
  }
  y += 36;
  for (const line of wrap(p.exceptionsLine, 46)) {
    parts.push(`<text x="90" y="${y}" ${F} font-size="32" fill="#c96a5a">${escapeXml(line)}</text>`);
    y += 46;
  }
  y += 24;
  for (const line of wrap(p.ivaLine, 46)) {
    parts.push(`<text x="90" y="${y}" ${F} font-size="32" fill="#e9dcbe">${escapeXml(line)}</text>`);
    y += 46;
  }
  if (p.tavernLine) {
    y += 24;
    for (const line of wrap(p.tavernLine, 46)) {
      parts.push(
        `<text x="90" y="${y}" ${F} font-size="28" fill="#b6a683">${escapeXml(line)}</text>`,
      );
      y += 42;
    }
  }

  // stat bars
  y = H - 300;
  const barW = 860;
  STATS.filter((stat) => p.shownStats.includes(stat.id)).forEach((stat, i) => {
    const by = y + i * 54;
    const value = p.stats[stat.id];
    parts.push(
      `<text x="90" y="${by + 22}" ${F} font-size="26" fill="#b6a683">${escapeXml(
        UI.stats[stat.id],
      )}</text>`,
    );
    parts.push(`<rect x="330" y="${by + 2}" width="${barW - 240}" height="22" fill="#3a3128"/>`);
    parts.push(
      `<rect x="330" y="${by + 2}" width="${
        ((barW - 240) * value) / CONFIG.statMax
      }" height="22" fill="#e9dcbe"/>`,
    );
  });

  const monarch = monarchOf(state.seed);
  parts.push(
    `<text x="90" y="${H - 150}" ${F} font-size="26" fill="#e9dcbe">${escapeXml(
      p.soulsLine,
    )}</text>`,
  );
  parts.push(
    `<text x="90" y="${H - 110}" ${F} font-size="26" fill="#b6a683">${escapeXml(
      `${UI.monarch.servedUnder} ${monarch.name}`,
    )}</text>`,
  );
  parts.push(
    `<text x="90" y="${H - 70}" ${F} font-size="26" fill="#b6a683">${escapeXml(
      PORTRAIT_UI.lawsLine
        .replace('{active}', String(p.lawCounts.active))
        .replace('{replaced}', String(p.lawCounts.replaced))
        .replace('{repealed}', String(p.lawCounts.repealed)),
    )}</text>`,
  );
  parts.push('</svg>');
  return parts.join('');
}

/** Draw the card the reign earned, and hand it over however this page can. */
async function sharePng(svg: string): Promise<Offer> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas context');
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('png encode failed');
    return await offerFile('my-reign.png', png);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Portrait({ state, onBeginAnew }: Props) {
  const p = computePortrait(state);
  const score = reignScore(state);
  const rows = scoreboard(state, state.townName);
  const came = placing(rows);
  const monarch = monarchOf(state.seed);
  const epithet = epithetOf(state);
  /* Your own row wears the head you were given at the founding, over the coat
     and the quill the job put on you. Forty years is a long time and it was
     still one person. */
  const founder = foundingLooks(state.seed).you;
  const yours = { ...YOU_LOOK, r: founder.r, y: founder.y, hair: founder.hair };
  const [fallbackSvg, setFallbackSvg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    const svg = buildShareSvg(state);
    setBusy(true);
    try {
      // saved, or refused on purpose: either way the card is not broken, and
      // showing it inline underneath would only be the screen saying "well?"
      const how = await sharePng(svg);
      setFallbackSvg(how === 'unavailable' ? svg : null);
    } catch {
      setFallbackSvg(svg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pb-10">
      <h2 className="mb-1 text-[11px] uppercase tracking-[0.2em] text-parchment-dim">
        {UI.portrait.heading}
      </h2>
      {/* the place had no name for the first two years and has one now: it is
          the shortest way to say a whole reign happened */}
      {state.townName && (
        <div className="text-[20px] leading-tight tracking-wide">{state.townName}</div>
      )}
      {/* How long it went on, which the card never said anywhere. A reign is
          made of years more than of anything else and the number was only ever
          in the header, where it stopped the moment the reign did. */}
      <div className="mb-3 mt-0.5 text-[13px] text-parchment-dim">
        {SCORE_UI.standing.replace('{years}', String(score.years))}
      </div>

      <section className="rounded-lg border border-ink-line bg-ink-soft p-4">
        {/* When a reign ended badly, the card opens with the face it ended on
            and the mark for the thing that did it. A reign that ran its course
            has neither: the reading is the ending. */}
        {p.endingIcon && (
          <div className="mb-3 flex items-center gap-3">
            <MonarchPortrait stage={state.stage} monarch={monarch} mood={0} size={56} />
            <span aria-hidden className="text-[34px] leading-none">
              {p.endingIcon}
            </span>
          </div>
        )}
        <h1 className="text-2xl leading-snug">{p.headline}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-parchment/90">{p.description}</p>
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.portrait.exceptionsHeading}
        </h3>
        <p className="text-[15px] leading-relaxed text-seal">{p.exceptionsLine}</p>
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.portrait.benchHeading}
        </h3>
        <div className="space-y-2">
          {p.benchLines.map((line, i) => (
            <p key={i} className="text-[15px] leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.portrait.ivaHeading}
        </h3>
        <p className="text-[15px] leading-relaxed">{p.ivaLine}</p>
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <p className="text-[15px] leading-relaxed text-parchment">{p.soulsLine}</p>
        {p.hamletLine && (
          <p className="mt-1 text-[14px] leading-snug text-parchment-dim">{p.hamletLine}</p>
        )}
        <h4 className="mb-2 mt-4 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.portrait.worksHeading}
        </h4>
        {p.workLines.length === 0 ? (
          <p className="text-[14px] text-parchment-dim">{UI.portrait.worksNone}</p>
        ) : (
          <ul className="space-y-1">
            {p.workLines.map((line, i) => (
              <li key={i} className="text-[14px] leading-snug text-parchment/90">
                {line}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {PORTRAIT_UI.reignHeading}
        </h3>
        <div className="space-y-2">
          {STATS.map((stat) => (
            <div key={stat.id} className="flex items-center gap-3">
              <span aria-hidden className="w-6 text-base">
                {stat.emoji}
              </span>
              <span className="w-20 text-[12px] uppercase tracking-wide text-parchment-dim">
                {UI.stats[stat.id]}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-sm bg-ink-line">
                <span
                  className="block h-full bg-parchment-dim"
                  style={{ width: `${(p.stats[stat.id] / CONFIG.statMax) * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-parchment-dim">
          {PORTRAIT_UI.lawsLine
            .replace('{active}', String(p.lawCounts.active))
            .replace('{replaced}', String(p.lawCounts.replaced))
            .replace('{repealed}', String(p.lawCounts.repealed))}
        </p>
        {p.flagLines.length > 0 && (
          <ul className="mt-3 space-y-1">
            {p.flagLines.map((line, i) => (
              <li key={i} className="text-[14px] leading-snug text-parchment/90">
                {line}
              </li>
            ))}
          </ul>
        )}
        {p.tavernLine && (
          <p className="mt-3 text-[14px] leading-snug text-parchment-dim">{p.tavernLine}</p>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.epithet.portraitHeading}
        </h3>
        {epithet ? (
          <>
            <div className="text-xl leading-tight tracking-wide">{epithet.name}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-parchment/90">{epithet.line}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-parchment-dim">{epithet.aside}</p>
          </>
        ) : (
          <p className="text-[14px] leading-relaxed text-parchment-dim">{UI.epithet.none}</p>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.monarch.servedUnder}
        </h3>
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-2xl leading-none">
            {monarch.emoji}
          </span>
          <span className="text-[15px]">{monarch.name}</span>
          <span className="text-[12px] text-parchment-dim">
            {UI.monarch.age.replace('{n}', String(monarchAge(state.seed, state.turn)))}
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-parchment/90">{monarch.portraitLine}</p>
      </section>

      {/* Three other places down the same road, and this one among them.
          The game spends twenty years refusing to say whether you are doing
          well, on purpose, so the number is allowed here and nowhere else, and
          it shows its own arithmetic underneath rather than handing down a
          verdict nobody can check. */}
      <section className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-4">
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {SCORE_UI.heading}
        </h3>

        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className={`flex items-center gap-3 rounded-md border p-2 ${
                row.you ? 'border-seal bg-seal/10' : 'border-ink-line'
              }`}
            >
              <span className="w-4 shrink-0 text-center text-[12px] tabular-nums text-parchment-dim">
                {i + 1}
              </span>
              <FolkIcon
                doing={(row.rival?.look ?? yours).doing}
                look={row.rival?.look ?? yours}
                size={40}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span
                    className={`truncate text-[14px] ${row.you ? 'text-seal' : 'text-parchment'}`}
                  >
                    {row.name}
                  </span>
                  {row.town && (
                    <span className="shrink-0 text-[11px] text-parchment-dim">{row.town}</span>
                  )}
                </span>
                {row.line && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-parchment-dim">
                    {row.line}
                  </span>
                )}
              </span>
              <span
                className={`shrink-0 text-[15px] tabular-nums ${
                  row.you ? 'text-seal' : 'text-parchment-dim'
                }`}
              >
                {row.score}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-3 text-[13px] leading-relaxed text-parchment/90">{PLACING_LINES[came]}</p>

        {/* the sum, so the number is a thing to argue with rather than a grade */}
        <ul className="mt-3 border-t border-ink-line pt-2">
          {score.parts.map((part) => (
            <li key={part.label} className="flex items-baseline gap-2 text-[12px]">
              <span className="flex-1 text-parchment-dim">
                {part.label}
                <span className="ml-1.5 tabular-nums text-parchment-dim/70">{part.detail}</span>
              </span>
              <span
                className={`w-12 text-right tabular-nums ${
                  part.value < 0 ? 'text-seal' : 'text-parchment-dim'
                }`}
              >
                {part.value > 0 ? `+${part.value}` : part.value}
              </span>
            </li>
          ))}
          <li className="mt-1 flex items-baseline gap-2 border-t border-ink-line pt-1 text-[13px]">
            <span className="flex-1 text-parchment-dim">{SCORE_UI.total}</span>
            <span className="w-12 text-right tabular-nums text-parchment">{score.total}</span>
          </li>
        </ul>
      </section>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onShare}
          disabled={busy}
          className="min-h-[52px] w-full rounded-md bg-seal px-5 py-3 text-lg tracking-wide text-parchment disabled:opacity-50"
        >
          {busy ? UI.portrait.shareWorking : UI.portrait.share}
        </button>
        <button
          type="button"
          onClick={onBeginAnew}
          className="min-h-[52px] w-full rounded-md border border-ink-line bg-ink-soft px-5 py-3 text-lg tracking-wide text-parchment"
        >
          {UI.portrait.beginAnew}
        </button>
      </div>

      {fallbackSvg && (
        <div className="mt-4">
          <p className="mb-2 text-[13px] text-parchment-dim">{UI.portrait.shareFallback}</p>
          <div
            className="overflow-hidden rounded-md border border-ink-line"
            dangerouslySetInnerHTML={{ __html: fallbackSvg }}
          />
        </div>
      )}
    </div>
  );
}
