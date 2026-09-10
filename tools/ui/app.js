import { h, kv, store, numField, textField, selectField, chip, signed, toast, api, table } from './ui.js';
import {
  STAT_IDS,
  lawId,
  condText,
  condRefs,
  lawOptions,
  effectRows,
  statSummary,
  influenceLinks,
  influenceMatrix,
  buildTree,
  layoutTree,
  warnings,
} from './model.js';

let model = null;
let tab = 'rates';
const sel = { proposal: null, case: null, cell: null, node: null };
const filter = { text: '', stat: 'all', kind: 'all', when: 'all', caseText: '', character: 'all' };
const treeOpts = { showFlags: true, showCases: true, showWorks: true, focus: null };

const view = document.getElementById('view');
const dirtyPill = document.getElementById('dirty');
const saveBtn = document.getElementById('save');
const discardBtn = document.getElementById('discard');
const runOut = document.getElementById('runout');

/* -------------------------------------------------------------------- boot */

async function boot() {
  store.onChange = paintDirty;
  await reload();
  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => {
      tab = b.dataset.tab;
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b));
      render();
    });
  });
  saveBtn.addEventListener('click', save);
  discardBtn.addEventListener('click', () => {
    store.clear();
    render();
  });
  document.getElementById('reload').addEventListener('click', () => reload().then(render));
  document.getElementById('validate').addEventListener('click', () => run('validate'));
  document.getElementById('tests').addEventListener('click', () => run('test'));
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  });
}

async function reload() {
  model = await api('/api/model');
  store.model = model;
  if (!sel.proposal && model.proposals.length) sel.proposal = model.proposals[0].id;
  if (!sel.case && model.cases.length) sel.case = model.cases[0].id;
  paintDirty();
}

function paintDirty() {
  const n = store.pending.size;
  dirtyPill.textContent = n === 0 ? 'no unsaved edits' : n + ' unsaved';
  dirtyPill.classList.toggle('dirty', n > 0);
  saveBtn.disabled = n === 0;
  discardBtn.disabled = n === 0;
}

async function save() {
  if (store.pending.size === 0) return;
  const ops = store.ops();
  try {
    const res = await api('/api/patch', { ops });
    store.clear();
    model = res.model;
    store.model = model;
    render();
    toast('Wrote ' + ops.length + ' value(s) to ' + res.touched.join(', '));
  } catch (err) {
    toast('Save failed: ' + err.message, true);
  }
}

async function run(script) {
  runOut.replaceChildren(h('div', { class: 'panel' }, h('h2', { text: 'npm run ' + script }), h('p', { class: 'hint', text: 'running...' })));
  try {
    const res = await api('/api/run', { script });
    runOut.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        h('h2', { text: 'npm run ' + script + (res.ok ? ' - passed' : ' - failed') }),
        h('pre', { class: 'out', text: res.output.trim() || '(no output)' }),
        h('button', { class: 'btn ghost', onclick: () => runOut.replaceChildren() }, 'close'),
      ),
    );
  } catch (err) {
    toast(err.message, true);
  }
}

/* ------------------------------------------------------------------ render */

function render() {
  if (tab === 'rates') view.replaceChildren(...ratesTab());
  else if (tab === 'laws') view.replaceChildren(lawsTab());
  else if (tab === 'cases') view.replaceChildren(casesTab());
  else if (tab === 'reign') view.replaceChildren(reignTab());
  else view.replaceChildren(treeTab());
}

/* ------------------------------------------------------------- rates tab */

function ratesTab() {
  const rows = effectRows(model);
  const sum = statSummary(rows);
  const links = influenceLinks(model);
  const matrix = influenceMatrix(links);
  const out = [];

  // 1. the boards
  out.push(
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'The four boards' }),
      h('p', {
        class: 'hint',
        text:
          'Every board starts at ' +
          model.config.statStart +
          ' and lives between ' +
          model.config.statMin +
          ' and ' +
          model.config.statMax +
          '. One number may move a board by ' +
          model.config.effectMin +
          '..' +
          model.config.effectMax +
          '.',
      }),
      h(
        'div',
        { class: 'grid4' },
        STAT_IDS.map((s) => {
          const d = sum[s];
          const meta = model.meta.stats.find((m) => m.id === s);
          return h(
            'div',
            { class: 'card' },
            h('h4', { text: (meta ? meta.emoji + ' ' : '') + s }),
            kv(
              'numbers',
              String(d.count),
              'sum up',
              h('span', { class: 'pos', text: '+' + d.up }),
              'sum down',
              h('span', { class: 'neg', text: String(d.down) }),
              'net',
              signed(d.net),
              'per turn',
              signed(d.perTurn),
              'range',
              d.min + ' .. ' + d.max,
            ),
          );
        }),
      ),
    ),
  );

  // 2. how the boards reach each other
  const cellList = h('div', {});
  const drawCell = () => {
    if (!sel.cell) {
      cellList.replaceChildren(h('p', { class: 'hint', text: 'Pick a cell or an arrow to read the paths behind it.' }));
      return;
    }
    const cell = matrix[sel.cell.from][sel.cell.to];
    cellList.replaceChildren(
      h('h4', { text: sel.cell.from + ' -> ' + sel.cell.to + ': ' + cell.count + ' path(s), net ' + cell.net }),
      h(
        'div',
        { class: 'scroll' },
        table(
          [
            { title: 'gate', get: (l) => l.gate.stat + l.gate.op + l.gate.value, cell: (l) => h('span', { class: 'mono' }, (l.gate.negated ? 'NOT ' : '') + l.gate.stat + ' ' + (l.gate.op === 'lte' ? '<=' : '>=') + ' ' + l.gate.value) },
            { title: 'opens', get: (l) => l.eventLabel, cell: (l) => h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo(l.eventKind, l.eventId); } }, l.eventLabel) },
            { title: 'answer', get: (l) => l.via, cell: (l) => h('span', { class: 'muted' }, l.via) },
            { title: 'moves', get: (l) => l.value, num: true, cell: (l) => h('span', {}, l.to + ' ', signed(l.value)) },
          ],
          cell.links,
        ),
      ),
    );
  };

  const pickCell = (from, to) => {
    sel.cell = matrix[from][to].count ? { from, to } : null;
    view.querySelectorAll('.matrix td.cell').forEach((td) => {
      td.classList.toggle('on', sel.cell && td.dataset.from === sel.cell.from && td.dataset.to === sel.cell.to);
    });
    drawCell();
  };

  out.push(
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'How the boards move each other' }),
      h('p', {
        class: 'hint',
        text:
          'No board changes another one directly. A board opens a gate (a threshold in a trigger), the gate lets an event in, and the answers to that event move other boards. ' +
          links.length +
          ' such paths exist right now.',
      }),
      h(
        'div',
        { class: 'cols wide' },
        h('div', {}, wheel(matrix, pickCell)),
        h('div', {}, matrixTable(matrix, pickCell), cellList),
      ),
    ),
  );
  drawCell();

  // 3. every number in the game
  out.push(effectsPanel(rows));

  // 4. dials that are not effects
  out.push(
    h(
      'div',
      { class: 'cols wide' },
      configPanel(),
      h('div', {}, readingsPanel(), monarchPanel()),
    ),
  );

  // 5. warnings
  const warns = warnings(model);
  out.push(
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'Checks (' + warns.length + ')' }),
      warns.length === 0
        ? h('p', { class: 'hint', text: 'Nothing to report.' })
        : warns.map((w) => h('div', { class: 'warnbox' + (w.level === 'error' ? ' error' : ''), text: w.text })),
    ),
  );

  return out;
}

function wheel(matrix, pick) {
  const size = 420;
  const cx = size / 2;
  const cy = 200;
  const r = 130;
  const pos = {};
  STAT_IDS.forEach((s, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / STAT_IDS.length;
    pos[s] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + (cy + 200));
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '400');
  svg.classList.add('wheel');

  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, text) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== undefined) el.textContent = text;
    return el;
  };

  const defs = mk('defs', {});
  for (const [id, color] of [['ah', '#7a7263'], ['ahp', '#2f7a4f'], ['ahn', '#a03030']]) {
    const marker = mk('marker', {
      id,
      viewBox: '0 0 10 10',
      refX: '9',
      refY: '5',
      markerWidth: '6',
      markerHeight: '6',
      orient: 'auto-start-reverse',
    });
    marker.append(mk('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color }));
    defs.append(marker);
  }
  svg.append(defs);

  for (const from of STAT_IDS) {
    for (const to of STAT_IDS) {
      const cell = matrix[from][to];
      if (cell.count === 0) continue;
      const a = pos[from];
      const b = pos[to];
      const color = cell.net > 0 ? '#2f7a4f' : cell.net < 0 ? '#a03030' : '#7a7263';
      const marker = cell.net > 0 ? 'ahp' : cell.net < 0 ? 'ahn' : 'ah';
      const width = 1 + Math.min(cell.count, 10) * 0.45;
      let d;
      if (from === to) {
        const ux = (a.x - cx) / r;
        const uy = (a.y - cy) / r;
        d =
          'M ' + (a.x + uy * 14) + ' ' + (a.y - ux * 14) +
          ' C ' + (a.x + ux * 78 + uy * 34) + ' ' + (a.y + uy * 78 - ux * 34) +
          ' ' + (a.x + ux * 78 - uy * 34) + ' ' + (a.y + uy * 78 + ux * 34) +
          ' ' + (a.x - uy * 14) + ' ' + (a.y + ux * 14);
      } else {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = mx + (dy / len) * 34;
        const py = my - (dx / len) * 34;
        const shrink = 34 / len;
        const sx = a.x + dx * shrink;
        const sy = a.y + dy * shrink;
        const ex = b.x - dx * shrink;
        const ey = b.y - dy * shrink;
        d = 'M ' + sx + ' ' + sy + ' Q ' + px + ' ' + py + ' ' + ex + ' ' + ey;
      }
      const path = mk('path', {
        d,
        fill: 'none',
        stroke: color,
        'stroke-width': String(width),
        'marker-end': 'url(#' + marker + ')',
        opacity: '0.85',
        style: 'cursor:pointer',
      });
      path.addEventListener('click', () => pick(from, to));
      const title = mk('title', {}, from + ' -> ' + to + ': ' + cell.count + ' paths, net ' + cell.net);
      path.append(title);
      svg.append(path);
    }
  }

  for (const s of STAT_IDS) {
    const p = pos[s];
    const meta = model.meta.stats.find((m) => m.id === s);
    svg.append(mk('circle', { cx: p.x, cy: p.y, r: 32, fill: '#fffdf7', stroke: '#ded3ba', 'stroke-width': '1.5' }));
    svg.append(mk('text', { x: p.x, y: p.y - 2, 'text-anchor': 'middle', 'font-size': '16' }, meta ? meta.emoji : ''));
    svg.append(mk('text', { x: p.x, y: p.y + 14, 'text-anchor': 'middle', 'font-size': '10', fill: '#7a7263' }, s));
  }
  return svg;
}

function matrixTable(matrix, pick) {
  const head = h('tr', {}, h('th', { text: 'from \\ to' }), STAT_IDS.map((s) => h('th', { class: 'num', text: s })));
  const body = STAT_IDS.map((from) =>
    h(
      'tr',
      {},
      h('th', { text: from }),
      STAT_IDS.map((to) => {
        const cell = matrix[from][to];
        const td = h(
          'td',
          { class: 'cell' + (cell.count ? '' : ' muted'), onclick: () => pick(from, to) },
          cell.count === 0 ? '-' : h('span', {}, String(cell.count), ' ', h('span', { class: 'muted mono' }, '(' + (cell.net > 0 ? '+' : '') + cell.net + ')')),
        );
        td.dataset.from = from;
        td.dataset.to = to;
        return td;
      }),
    ),
  );
  return h('table', { class: 'matrix' }, h('thead', {}, head), h('tbody', {}, body));
}

function effectsPanel(rows) {
  const listWrap = h('div', { class: 'scroll' });
  const footer = h('p', { class: 'hint' });

  const draw = () => {
    let data = rows;
    if (filter.stat !== 'all') data = data.filter((r) => r.stat === filter.stat);
    if (filter.kind !== 'all') data = data.filter((r) => r.kind === filter.kind);
    if (filter.when !== 'all') data = data.filter((r) => r.when === filter.when);
    if (filter.text.trim()) {
      const q = filter.text.trim().toLowerCase();
      data = data.filter((r) =>
        (r.ownerId + ' ' + r.ownerLabel + ' ' + r.detail + ' ' + (r.lawId || '') + ' ' + (r.tags || []).join(' '))
          .toLowerCase()
          .includes(q),
      );
    }
    const net = data.reduce((a, r) => a + r.value, 0);
    footer.textContent = data.length + ' numbers, net ' + (net > 0 ? '+' : '') + net;
    listWrap.replaceChildren(
      table(
        [
          {
            title: 'where',
            get: (r) => r.ownerId,
            cell: (r) =>
              h(
                'a',
                { href: '#', onclick: (e) => { e.preventDefault(); jumpTo(r.kind === 'case' || r.kind === 'exception' ? 'case' : r.kind === 'decree' ? 'case' : 'proposal', r.ownerId); } },
                r.ownerId,
              ),
          },
          { title: 'what', get: (r) => r.detail, cell: (r) => h('span', {}, r.detail) },
          { title: 'kind', get: (r) => r.kind + r.when, cell: (r) => h('span', { class: 'muted' }, r.kind + ' / ' + r.when) },
          { title: 'board', get: (r) => r.stat, cell: (r) => r.stat },
          {
            title: 'value',
            num: true,
            get: (r) => r.value,
            cell: (r) =>
              r.readOnly
                ? h('span', { class: 'muted', title: 'comes from CONFIG.exceptionSanityCost' }, String(r.value))
                : numField(
                    { source: r.source, root: r.root, path: r.path },
                    r.value,
                    { min: model.config.effectMin, max: model.config.effectMax },
                  ),
          },
          { title: 'tags', get: (r) => (r.tags || []).join(','), cell: (r) => (r.tags || []).map((t) => chip(t, 'tag')) },
        ],
        data,
        { sortIdx: -1 },
      ),
    );
  };

  const sel1 = h('select', { class: 'f', onchange: (e) => { filter.stat = e.target.value; draw(); } },
    ['all', ...STAT_IDS].map((s) => h('option', { value: s, selected: filter.stat === s ? true : undefined }, s)));
  const sel2 = h('select', { class: 'f', onchange: (e) => { filter.kind = e.target.value; draw(); } },
    ['all', 'law', 'case', 'decree', 'exception'].map((s) => h('option', { value: s, selected: filter.kind === s ? true : undefined }, s)));
  const sel3 = h('select', { class: 'f', onchange: (e) => { filter.when = e.target.value; draw(); } },
    ['all', 'on seal', 'per turn', 'on choice', 'automatic'].map((s) => h('option', { value: s, selected: filter.when === s ? true : undefined }, s)));
  const search = h('input', { class: 'f text', placeholder: 'search text, id, tag', value: filter.text, style: 'max-width:280px' });
  search.addEventListener('input', () => { filter.text = search.value; draw(); });

  draw();
  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'Every number in the game' }),
    h('p', { class: 'hint', text: 'Change a value and it is written back into the source file it came from. An empty box removes the number.' }),
    h('div', { class: 'row' }, 'board', sel1, 'kind', sel2, 'when', sel3, search),
    listWrap,
    footer,
  );
}

function configPanel() {
  const kids = [];
  for (const [k, v] of Object.entries(model.config)) {
    if (typeof v === 'number') {
      kids.push(h('div', { class: 'muted', text: k }), numField({ source: 'config', root: 'CONFIG', path: [k] }, v));
    }
  }
  for (const [k, v] of Object.entries(model.config)) {
    if (v && typeof v === 'object') {
      for (const [k2, v2] of Object.entries(v)) {
        kids.push(
          h('div', { class: 'muted', text: k + '.' + k2 }),
          numField({ source: 'config', root: 'CONFIG', path: [k, k2] }, v2, { step: k === 'divergenceMax' ? 0.01 : 1 }),
        );
      }
    }
  }
  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'Engine dials (src/engine/config.ts)' }),
    kv( kids),
  );
}

function readingsPanel() {
  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'What the town says at each level' }),
    h('p', { class: 'hint', text: 'Bands are read in order; upTo is inclusive. This is the only place a board becomes words.' }),
    STAT_IDS.map((s) =>
      h(
        'div',
        { class: 'card' },
        h('h4', { text: s }),
        (model.readings[s] || []).map((b, bi) =>
          h(
            'div',
            { class: 'row', style: 'margin-bottom:4px' },
            h('span', { class: 'muted', text: 'upTo' }),
            numField({ source: 'readings', root: 'READINGS', path: [s, bi, 'upTo'] }, b.upTo, { min: 0, max: model.config.statMax }),
            b.urgent ? chip('urgent', 'bad') : null,
            h('span', { style: 'flex:1;min-width:260px' }, textField({ source: 'readings', root: 'READINGS', path: [s, bi, 'line'] }, b.line)),
          ),
        ),
      ),
    ),
  );
}

function monarchPanel() {
  const traitKeys = ['treasuryGainBonus', 'healthLossRelief', 'moodAmplify', 'exceptionSanityCost', 'feastDelayShift', 'feastRepeatShift', 'feastExtraFires'];
  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'The monarch bends one rule' }),
    h('p', { class: 'hint', text: 'The seed picks one of these at New Game. The trait changes the arithmetic for the whole reign.' }),
    model.monarchs.map((m, mi) =>
      h(
        'div',
        { class: 'card' },
        h('h4', { text: m.emoji + ' ' + m.name + ' (' + m.traitName + ')' }),
        h('div', { class: 'row' }, chip('touches ' + m.touches), h('span', { class: 'muted', text: m.traitLine })),
        h(
          'div',
          { class: 'row', style: 'margin-top:6px' },
          traitKeys
            .filter((k) => m.trait[k] !== undefined)
            .map((k) =>
              h('span', { class: 'row' }, h('span', { class: 'muted mono', text: k }), numField({ source: 'monarchs', root: 'MONARCHS', path: [mi, 'trait', k] }, m.trait[k])),
            ),
        ),
      ),
    ),
  );
}

/* -------------------------------------------------------------- laws tab */

function lawsTab() {
  const laws = lawOptions(model);
  const list = h(
    'div',
    { class: 'panel list' },
    h('h2', { text: 'Proposals (' + model.proposals.length + ')' }),
    model.proposals
      .slice()
      .sort((a, b) => a.act - b.act)
      .map((p) =>
        h(
          'div',
          {
            class: 'item' + (sel.proposal === p.id ? ' on' : ''),
            onclick: () => {
              sel.proposal = p.id;
              render();
            },
          },
          h('div', { class: 't', text: p.title }),
          h('div', { class: 's', text: 'act ' + p.act + ' / ' + p.advisor + ' / ' + p.options.length + ' options / ' + p.id }),
        ),
      ),
    h('h2', { text: 'Decrees written by cases', style: 'margin-top:14px' }),
    laws
      .filter((l) => l.origin === 'decree')
      .map((l) =>
        h(
          'div',
          { class: 'item', onclick: () => jumpTo('case', l.caseEvent.id) },
          h('div', { class: 't', text: l.option.label }),
          h('div', { class: 's', text: l.caseEvent.id + ' / ' + l.choice.id }),
        ),
      ),
  );

  const p = model.proposals.find((x) => x.id === sel.proposal) || model.proposals[0];
  return h('div', { class: 'cols' }, list, proposalPanel(p));
}

function proposalPanel(p) {
  if (!p) return h('div', { class: 'panel' }, 'nothing selected');
  const pi = model.proposals.indexOf(p);
  const src = { source: 'proposals', root: 'PROPOSALS' };

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: p.id }),
      kv(
        'title',
        textField({ ...src, path: [pi, 'title'] }, p.title),
        'act',
        numField({ ...src, path: [pi, 'act'] }, p.act, { min: 1, max: 4 }),
        'advisor',
        selectField({ ...src, path: [pi, 'advisor'] }, p.advisor, Object.keys(model.meta.advisors)),
        'arrives when',
        h(
          'span',
          {},
          p.unlockedBy ? condText(p.unlockedBy) : 'act ' + p.act + ' comes round, no extra condition',
          p.unlockedBy ? h('div', { class: 'mono muted', text: JSON.stringify(p.unlockedBy) }) : null,
        ),
      ),
      h('h2', { text: 'the advisor says', style: 'margin-top:10px' }),
      p.problem.map((para, i) => textField({ ...src, path: [pi, 'problem', i] }, para, { area: true })),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'Options (' + p.options.length + ')' }),
      p.options.map((o, oi) => optionCard(p, pi, o, oi)),
    ),
  );
}

function optionCard(p, pi, o, oi) {
  const src = { source: 'proposals', root: 'PROPOSALS' };
  const base = [pi, 'options', oi];
  const derived = derivedForLaw(o);
  const scene = model.aftermaths.find((a) => a.id === o.aftermathId);
  const ai = model.aftermaths.indexOf(scene);

  return h(
    'div',
    { class: 'card' + (o.isBadIdea ? ' badidea' : '') },
    h('div', { class: 'row' }, chip(lawId(o)), o.isBadIdea ? chip('bad idea', 'bad') : null, (o.tags || []).map((t) => chip(t, 'tag'))),
    h('div', { style: 'margin:6px 0' }, textField({ ...src, path: [...base, 'label'] }, o.label)),
    kv(
      'subject',
      selectField({ ...src, path: [...base, 'subject'] }, o.subject, model.meta.subjects.map((s) => s.id)),
      'action',
      selectField({ ...src, path: [...base, 'action'] }, o.action, model.meta.actions.map((a) => a.id)),
      'on seal',
      effectsEditor('proposals', 'PROPOSALS', base, 'effects', o.effects),
      'every turn',
      effectsEditor('proposals', 'PROPOSALS', base, 'perTurn', o.perTurn),
      'city layers',
      h('span', {}, (o.cityFlagsOn || []).map((f) => chip('+' + f, 'city')), (o.cityFlagsOff || []).map((f) => chip('-' + f, 'city'))),
      'scene',
      h('span', {}, o.aftermathId),
    ),
    scene
      ? h(
          'details',
          {},
          h('summary', { class: 'muted' }, 'the town reads it back (' + scene.paragraphs.length + ' paragraphs)'),
          scene.paragraphs.map((para, i) => textField({ source: 'aftermaths', root: 'AFTERMATHS', path: [ai, 'paragraphs', i] }, para, { area: true })),
          (scene.extra || []).map((ex, i) =>
            h(
              'div',
              { class: 'card' },
              h('div', { class: 'muted mono', text: 'when ' + condText(ex.when) }),
              textField({ source: 'aftermaths', root: 'AFTERMATHS', path: [ai, 'extra', i, 'paragraph'] }, ex.paragraph, { area: true }),
            ),
          ),
        )
      : h('div', { class: 'warnbox error', text: 'missing scene ' + o.aftermathId }),
    h(
      'details',
      { open: derived.total > 0 ? true : undefined },
      h('summary', { class: 'muted' }, 'what this law puts on the table (' + derived.total + ')'),
      derived.rows.length === 0 ? h('p', { class: 'hint', text: 'nothing depends on it' }) : derived.rows,
    ),
  );
}

function derivedForLaw(o) {
  const id = lawId(o);
  const rows = [];
  const linkCase = (c, why) =>
    rows.push(
      h(
        'div',
        { class: 'row' },
        chip(why),
        h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('case', c.id); } }, c.title),
        h('span', { class: 'muted mono', text: c.id }),
      ),
    );

  for (const c of model.cases) {
    const refs = condRefs(c.trigger).laws;
    for (const r of refs) {
      const match = (r.subject === undefined || r.subject === o.subject) && (r.action === undefined || r.action === o.action);
      if (match) linkCase(c, r.negated ? 'blocked while active' : r.kind === 'lawEver' ? 'opens (ever)' : 'opens');
    }
    for (const ch of c.choices) {
      if (ch.exceptionToLaw === id) linkCase(c, 'exception to it');
      if (ch.repealSubject === o.subject) linkCase(c, 'can repeal it');
    }
    const grammar = model.verdicts.cases[c.id];
    if (grammar) {
      for (const r of grammar.rulings) {
        if (r.needsLaw === id) {
          rows.push(h('div', { class: 'row' }, chip('grants a ruling'), h('span', { class: 'mono' }, c.id + ': ' + r.verb + (r.object ? ' ' + r.object : '') + ' -> ' + r.choiceId)));
        }
      }
    }
  }
  for (const p of model.proposals) {
    for (const r of condRefs(p.unlockedBy).laws) {
      const match = (r.subject === undefined || r.subject === o.subject) && (r.action === undefined || r.action === o.action);
      if (match) {
        rows.push(
          h('div', { class: 'row' }, chip('unlocks proposal'), h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('proposal', p.id); } }, p.title)),
        );
      }
    }
  }
  for (const loop of model.loops) {
    for (const r of condRefs(loop.arm).laws) {
      const match = (r.subject === undefined || r.subject === o.subject) && (r.action === undefined || r.action === o.action);
      if (match) rows.push(h('div', { class: 'row' }, chip('arms loop'), h('span', { class: 'mono' }, loop.id + ' -> ' + loop.caseId)));
    }
  }
  for (const a of model.aftermaths) {
    for (const ex of a.extra || []) {
      for (const r of condRefs(ex.when).laws) {
        const match = (r.subject === undefined || r.subject === o.subject) && (r.action === undefined || r.action === o.action);
        if (match) rows.push(h('div', { class: 'row' }, chip('extra paragraph'), h('span', { class: 'mono' }, a.id)));
      }
    }
  }
  return { rows, total: rows.length };
}

/** Four boxes for one Effects object. A box left empty removes that board. */
function effectsEditor(source, root, basePath, key, obj) {
  const wrap = h('span', { class: 'row' });
  const present = obj !== undefined && obj !== null;

  for (const stat of STAT_IDS) {
    const meta = model.meta.stats.find((m) => m.id === stat);
    let field;
    if (present) {
      field = numField({ source, root, path: [...basePath, key, stat] }, obj[stat], {
        min: model.config.effectMin,
        max: model.config.effectMax,
      });
    } else {
      // the whole object is missing: the first number written creates it
      const op = { source, root, path: [...basePath, key] };
      const staged = store.valueOf(op, undefined) || {};
      field = h('input', { class: 'f' + (store.isStaged(op) ? ' staged' : ''), type: 'number', value: staged[stat] === undefined ? '' : String(staged[stat]) });
      field.addEventListener('change', () => {
        const next = { ...(store.valueOf(op, undefined) || {}) };
        if (field.value === '') delete next[stat];
        else next[stat] = Number(field.value);
        if (Object.keys(next).length === 0) store.stage(op, undefined, undefined);
        else store.stage(op, next, undefined);
        field.classList.toggle('staged', store.isStaged(op));
      });
    }
    wrap.append(h('span', { class: 'row', style: 'gap:4px' }, h('span', { class: 'muted', title: stat }, meta ? meta.emoji : stat), field));
  }
  return wrap;
}

/* ------------------------------------------------------------- cases tab */

function casesTab() {
  const chars = ['all', ...new Set(model.cases.map((c) => c.character || 'none'))];
  const search = h('input', { class: 'f text', placeholder: 'search cases', value: filter.caseText });
  const charSel = h('select', { class: 'f' }, chars.map((c) => h('option', { value: c, selected: filter.character === c ? true : undefined }, c)));
  const listBox = h('div', { class: 'list' });

  const drawList = () => {
    let data = model.cases;
    if (filter.character !== 'all') data = data.filter((c) => (c.character || 'none') === filter.character);
    if (filter.caseText.trim()) {
      const q = filter.caseText.trim().toLowerCase();
      data = data.filter((c) => (c.id + ' ' + c.title + ' ' + condText(c.trigger) + ' ' + c.choices.map((x) => x.text).join(' ')).toLowerCase().includes(q));
    }
    listBox.replaceChildren(
      ...data.map((c) =>
        h(
          'div',
          {
            class: 'item' + (sel.case === c.id ? ' on' : ''),
            onclick: () => {
              sel.case = c.id;
              render();
            },
          },
          h('div', { class: 't' }, c.title, c.priority <= model.config.urgentPriority ? chip('urgent', 'bad') : null),
          h('div', { class: 's', text: c.id + ' / p' + c.priority + ' / ' + (c.character || 'no one') + ' / ' + c.choices.length + ' answers' }),
        ),
      ),
    );
  };
  search.addEventListener('input', () => {
    filter.caseText = search.value;
    drawList();
  });
  charSel.addEventListener('change', () => {
    filter.character = charSel.value;
    drawList();
  });
  drawList();

  const c = model.cases.find((x) => x.id === sel.case) || model.cases[0];
  return h(
    'div',
    { class: 'cols' },
    h('div', { class: 'panel' }, h('h2', { text: 'Cases (' + model.cases.length + ')' }), h('div', { class: 'row' }, search, charSel), listBox),
    casePanel(c),
  );
}

function casePanel(c) {
  if (!c) return h('div', { class: 'panel' }, 'nothing selected');
  const ci = model.cases.indexOf(c);
  const src = { source: 'cases', root: 'CASES' };
  const grammar = model.verdicts.cases[c.id];

  /* What has to have happened first, and what this one puts on the table
     afterwards, kept apart. One list mixed the two together and read as a pile
     of facts; the question anybody actually has here is what comes after
     what. */
  const before = [];
  const after = [];
  const refs = condRefs(c.trigger);
  const caseLink = (id) => h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('case', id); } }, id);
  const workOf = (id) => (model.works || []).find((w) => w.id === id);

  for (const l of lawOptions(model)) {
    for (const r of refs.laws) {
      const match = (r.subject === undefined || r.subject === l.option.subject) && (r.action === undefined || r.action === l.option.action);
      if (match) before.push(h('div', { class: 'row' }, chip(r.negated ? 'blocked by law' : 'opened by law'), h('span', {}, l.option.label), h('span', { class: 'muted mono' }, l.id)));
    }
  }
  /* A law is a thing the place believes and a work is a thing it has. A scene
     about a building waits on the building, and this row is where that shows. */
  for (const r of refs.works) {
    const w = workOf(r.work);
    before.push(
      h(
        'div',
        { class: 'row' },
        chip(r.negated ? 'only without' : 'needs built', r.negated ? 'bad' : 'good'),
        h('span', {}, w ? w.name : r.work),
        h('span', { class: 'muted mono' }, r.work + (r.level > 1 ? ' level ' + r.level : '') + (w ? ' / ' + w.cost + ' points' : '')),
      ),
    );
  }
  for (const r of refs.flags) before.push(h('div', { class: 'row' }, chip(r.negated ? 'blocked by flag' : 'needs flag'), chip(r.flag, 'flag')));
  for (const r of refs.cases) before.push(h('div', { class: 'row' }, chip(r.negated ? 'blocked by scene' : 'after scene'), caseLink(r.caseId)));
  for (const r of refs.sinces) before.push(h('div', { class: 'row' }, chip('years after'), caseLink(r.caseId), h('span', { class: 'muted mono' }, '+' + r.years + ' years')));
  for (const r of refs.souls) before.push(h('div', { class: 'row' }, chip('the count'), h('span', { class: 'mono' }, 'souls ' + (r.op === 'lte' ? '<=' : '>=') + ' ' + r.value)));
  for (const r of refs.stages) before.push(h('div', { class: 'row' }, chip('the stage'), h('span', { class: 'mono' }, r.negated ? 'not a ' + r.stage : 'a ' + r.stage)));
  for (const r of refs.stats) before.push(h('div', { class: 'row' }, chip('board gate'), h('span', { class: 'mono' }, r.stat + ' ' + (r.op === 'lte' ? '<=' : '>=') + ' ' + r.value)));
  for (const r of refs.turns) before.push(h('div', { class: 'row' }, chip('timing'), h('span', { class: 'mono' }, 'turn ' + (r.op === 'lte' ? '<=' : '>=') + ' ' + r.value)));

  for (const other of model.cases) {
    for (const ch of other.choices) {
      if (ch.schedule && ch.schedule.caseId === c.id) {
        before.push(
          h('div', { class: 'row' }, chip('put here by'), caseLink(other.id), h('span', { class: 'muted' }, '+' + ch.schedule.inTurns + ' turns after "' + ch.text + '"')),
        );
      }
    }
    if (other.id === c.id) continue;
    for (const r of condRefs(other.trigger).cases) {
      if (r.caseId === c.id) after.push(h('div', { class: 'row' }, chip(r.negated ? 'then blocks' : 'then opens'), caseLink(other.id)));
    }
    for (const r of condRefs(other.trigger).sinces) {
      if (r.caseId === c.id) after.push(h('div', { class: 'row' }, chip('then opens'), caseLink(other.id), h('span', { class: 'muted mono' }, '+' + r.years + ' years')));
    }
  }
  for (const ch of c.choices) {
    if (ch.schedule) after.push(h('div', { class: 'row' }, chip('schedules'), caseLink(ch.schedule.caseId), h('span', { class: 'muted' }, '+' + ch.schedule.inTurns + ' turns after "' + ch.text + '"')));
    for (const f of ch.setFlags || []) after.push(h('div', { class: 'row' }, chip('sets flag', 'flag'), chip(f, 'flag'), h('span', { class: 'muted' }, 'on "' + ch.text + '"')));
  }
  for (const loop of model.loops) {
    if (loop.caseId === c.id) {
      const li = model.loops.indexOf(loop);
      before.push(
        h(
          'div',
          { class: 'row' },
          chip('fired by loop ' + loop.id),
          h('span', { class: 'muted mono' }, condText(loop.arm)),
          'delay',
          numField({ source: 'loops', root: 'LOOPS', path: [li, 'delayTurns'] }, loop.delayTurns),
          'max fires',
          numField({ source: 'loops', root: 'LOOPS', path: [li, 'maxFires'] }, loop.maxFires),
        ),
      );
    }
  }

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: c.id }),
      kv(
        'title',
        textField({ ...src, path: [ci, 'title'] }, c.title),
        'priority',
        h('span', { class: 'row' }, numField({ ...src, path: [ci, 'priority'] }, c.priority, { min: 1, max: 99 }), h('span', { class: 'muted', text: 'at or under ' + model.config.urgentPriority + ' it jumps the queue' })),
        'character',
        h('span', {}, c.character || '-'),
        'trigger',
        h('span', {}, condText(c.trigger), h('div', { class: 'mono muted', text: JSON.stringify(c.trigger) })),
      ),
      h('h2', { text: 'scene', style: 'margin-top:10px' }),
      c.scene.map((para, i) => textField({ ...src, path: [ci, 'scene', i] }, para, { area: true })),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'Before it can happen (' + before.length + ')' }),
      h('p', { class: 'hint', text: 'Every one of these has to be true in the same year, unless the trigger says OR.' }),
      before.length ? before : h('p', { class: 'hint', text: 'nothing: this one can arrive in the first spring' }),
      h('h2', { text: 'And after it (' + after.length + ')', style: 'margin-top:12px' }),
      after.length ? after : h('p', { class: 'hint', text: 'nothing waits on this one' }),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'Answers (' + c.choices.length + ')' }),
      c.choices.map((ch, chi) => choiceCard(c, ci, ch, chi, grammar)),
    ),
    grammar
      ? h(
          'div',
          { class: 'panel' },
          h('h2', { text: 'The bench' }),
          h('p', { class: 'hint', text: 'subject: ' + grammar.subject }),
          table(
            [
              { title: 'verb', get: (r) => r.verb, cell: (r) => h('span', { class: 'mono' }, r.verb) },
              { title: 'object', get: (r) => r.object || '', cell: (r) => h('span', { class: 'mono' }, r.object || '-') },
              { title: 'rules as', get: (r) => r.choiceId, cell: (r) => (c.choices.some((x) => x.id === r.choiceId) ? r.choiceId : h('span', { class: 'neg' }, r.choiceId + ' (missing)')) },
              { title: 'needs law', get: (r) => r.needsLaw || '', cell: (r) => (r.needsLaw ? chip(r.needsLaw) : h('span', { class: 'muted' }, '-')) },
            ],
            grammar.rulings,
          ),
        )
      : h('div', { class: 'panel warnbox', text: 'no ruling grammar for this case' }),
  );
}

function choiceCard(c, ci, ch, chi, grammar) {
  const src = { source: 'cases', root: 'CASES' };
  const base = [ci, 'choices', chi];
  const rulings = grammar ? grammar.rulings.filter((r) => r.choiceId === ch.id) : [];

  return h(
    'div',
    { class: 'card' },
    h('div', { class: 'row' }, chip(ch.id), (ch.tags || []).map((t) => chip(t, 'tag')), ch.setIva ? chip('Iva: ' + ch.setIva) : null, (ch.setFlags || []).map((f) => chip('sets ' + f, 'flag'))),
    h('div', { style: 'margin:6px 0' }, textField({ ...src, path: [...base, 'text'] }, ch.text)),
    kv(
      'moves',
      effectsEditor('cases', 'CASES', base, 'effects', ch.effects),
      'result',
      textField({ ...src, path: [...base, 'result'] }, ch.result, { area: true }),
    ),
    (ch.exceptionToLaw || ch.schedule || ch.enactLaw || ch.repealSubject || (ch.cityFlagsOn || []).length || (ch.cityFlagsOff || []).length)
      ? kv(
          ch.exceptionToLaw ? 'exception' : null,
          ch.exceptionToLaw ? h('span', {}, chip(ch.exceptionToLaw), ' for ' + (ch.beneficiary || '?'), h('span', { class: 'muted' }, ' (sanity -' + model.config.exceptionSanityCost + ' automatically)')) : null,
          ch.schedule ? 'schedules' : null,
          ch.schedule
            ? h(
                'span',
                { class: 'row' },
                h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('case', ch.schedule.caseId); } }, ch.schedule.caseId),
                'in',
                numField({ ...src, path: [...base, 'schedule', 'inTurns'] }, ch.schedule.inTurns, { min: 1 }),
                'turns',
              )
            : null,
          ch.enactLaw ? 'decrees' : null,
          ch.enactLaw
            ? h('span', {}, h('div', {}, textField({ ...src, path: [...base, 'enactLaw', 'label'] }, ch.enactLaw.label)), h('div', { class: 'row' }, chip(lawId(ch.enactLaw)), effectsEditor('cases', 'CASES', [...base, 'enactLaw'], 'effects', ch.enactLaw.effects)))
            : null,
          ch.repealSubject ? 'repeals' : null,
          ch.repealSubject ? chip('every law on ' + ch.repealSubject) : null,
          (ch.cityFlagsOn || []).length || (ch.cityFlagsOff || []).length ? 'city' : null,
          (ch.cityFlagsOn || []).length || (ch.cityFlagsOff || []).length
            ? h('span', {}, (ch.cityFlagsOn || []).map((f) => chip('+' + f, 'city')), (ch.cityFlagsOff || []).map((f) => chip('-' + f, 'city')))
            : null,
        )
      : null,
    rulings.length
      ? h('div', { class: 'muted mono', text: 'bench: ' + rulings.map((r) => r.verb + (r.object ? ' ' + r.object : '') + (r.needsLaw ? ' [needs ' + r.needsLaw + ']' : '')).join(' | ') })
      : h('div', { class: 'warnbox', text: 'this answer cannot be written at the bench' }),
  );
}

/* -------------------------------------------------------------- tree tab */

function treeTab() {
  const tree = buildTree(model, { showFlags: treeOpts.showFlags, showWorks: treeOpts.showWorks });
  const filtered = {
    nodes: tree.nodes.filter((n) => (treeOpts.showCases ? true : n.type !== 'case')),
    edges: tree.edges,
  };
  const ids = new Set(filtered.nodes.map((n) => n.id));
  filtered.edges = filtered.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  const laid = layoutTree(filtered);

  const detail = h('div', { class: 'panel' }, h('p', { class: 'hint', text: 'Click a box to read it here.' }));
  const wrap = h('div', { class: 'graphwrap' });
  const svg = drawTree(laid, (node) => {
    sel.node = node.id;
    detail.replaceChildren(nodeDetail(node));
    paintSelection(svg, laid, node.id);
  });
  wrap.append(svg);
  const zoom = enablePanZoom(wrap, svg, laid);
  wrap.append(
    h(
      'div',
      { class: 'graphlegend' },
      h('div', {}, h('b', {}, 'left to right: '), 'what puts what on the table'),
      [['proposal', 'proposal'], ['law', 'law option'], ['decree', 'decree from a case'], ['case', 'case'], ['work', 'year of work'], ['flag', 'story flag'], ['loop', 'loop']].map(([cls, label]) =>
        h('div', {}, h('span', { class: 'chip', style: 'border-color:var(--' + cls + ')' }, label)),
      ),
    ),
  );

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'The tree: what unlocks what' }),
      h('p', { class: 'hint', text: 'Acts run left to right. A law opens cases, a year of work opens the scenes that are about the thing it built, a case sets flags and schedules other cases, a flag opens the next law. Drag to pan, wheel to zoom.' }),
      h(
        'div',
        { class: 'row' },
        h('label', {}, h('input', { type: 'checkbox', checked: treeOpts.showFlags ? true : undefined, onchange: (e) => { treeOpts.showFlags = e.target.checked; render(); } }), ' story flags'),
        h('label', {}, h('input', { type: 'checkbox', checked: treeOpts.showCases ? true : undefined, onchange: (e) => { treeOpts.showCases = e.target.checked; render(); } }), ' cases'),
        h('label', {}, h('input', { type: 'checkbox', checked: treeOpts.showWorks ? true : undefined, onchange: (e) => { treeOpts.showWorks = e.target.checked; render(); } }), ' years of work'),
        h('button', { class: 'btn ghost', onclick: () => zoom.fit() }, 'fit'),
        h('button', { class: 'btn ghost', onclick: () => zoom.reset() }, '100%'),
        h('span', { class: 'muted', text: laid.nodes.length + ' boxes, ' + laid.edges.length + ' links' }),
      ),
    ),
    h('div', { class: 'cols rev' }, wrap, detail),
  );
}

function drawTree(laid, onPick) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', String(laid.width));
  svg.setAttribute('height', String(laid.height));
  const root = document.createElementNS(ns, 'g');
  svg.append(root);
  svg.__root = root;

  const pos = new Map(laid.nodes.map((n) => [n.id, n]));
  const W = 216;
  const H = 44;

  const edgeLayer = document.createElementNS(ns, 'g');
  root.append(edgeLayer);
  for (const e of laid.edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const x1 = a.x + W;
    const y1 = a.y + H / 2;
    const x2 = b.x;
    const y2 = b.y + H / 2;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2);
    path.setAttribute('class', 'edge ' + e.kind);
    path.dataset.from = e.from;
    path.dataset.to = e.to;
    const title = document.createElementNS(ns, 'title');
    title.textContent = e.kind + (e.label ? ': ' + e.label : '');
    path.append(title);
    edgeLayer.append(path);
  }

  for (const n of laid.nodes) {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'node ' + n.type);
    g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
    g.dataset.id = n.id;
    g.style.cursor = 'pointer';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', W);
    rect.setAttribute('height', H);
    rect.setAttribute('rx', '7');
    g.append(rect);
    const t1 = document.createElementNS(ns, 'text');
    t1.setAttribute('x', 10);
    t1.setAttribute('y', 18);
    t1.textContent = clip(n.label, 30);
    g.append(t1);
    const t2 = document.createElementNS(ns, 'text');
    t2.setAttribute('x', 10);
    t2.setAttribute('y', 33);
    t2.setAttribute('class', 'sub');
    t2.textContent = clip(n.sub || '', 34);
    g.append(t2);
    const title = document.createElementNS(ns, 'title');
    title.textContent = n.label + '\n' + (n.sub || '');
    g.append(title);
    g.addEventListener('click', () => onPick(n));
    root.append(g);
  }
  return svg;
}

function clip(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function paintSelection(svg, laid, id) {
  const keep = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of laid.edges) {
      if (keep.has(e.from) && !keep.has(e.to)) {
        keep.add(e.to);
        grew = true;
      }
      if (keep.has(e.to) && !keep.has(e.from)) {
        keep.add(e.from);
        grew = true;
      }
    }
  }
  svg.querySelectorAll('g.node').forEach((g) => {
    g.classList.toggle('dim', !keep.has(g.dataset.id));
    g.classList.toggle('sel', g.dataset.id === id);
  });
  svg.querySelectorAll('path.edge').forEach((p) => {
    const on = keep.has(p.dataset.from) && keep.has(p.dataset.to);
    p.classList.toggle('dim', !on);
    p.classList.toggle('hot', p.dataset.from === id || p.dataset.to === id);
  });
}

function nodeDetail(node) {
  const ref = node.ref;
  if (ref.kind === 'proposal') {
    const p = model.proposals.find((x) => x.id === ref.id);
    return h('div', {}, h('div', { class: 'panel' }, h('h2', { text: 'proposal' }), h('div', { class: 't', text: p.title }), h('button', { class: 'btn', onclick: () => jumpTo('proposal', p.id) }, 'open in Laws')), proposalPanel(p));
  }
  if (ref.kind === 'case') {
    const c = model.cases.find((x) => x.id === ref.id);
    return h('div', {}, h('div', { class: 'panel' }, h('h2', { text: 'case' }), h('button', { class: 'btn', onclick: () => jumpTo('case', c.id) }, 'open in Cases')), casePanel(c));
  }
  if (ref.kind === 'law') {
    const l = lawOptions(model).find((x) => x.key === ref.key);
    if (!l) return h('div', { class: 'panel' }, 'gone');
    if (l.origin === 'proposal') return proposalPanel(l.proposal);
    return casePanel(l.caseEvent);
  }
  /* A year of work, and the two questions anybody has about one: what has to
     stand before it can be spent, and which scenes it is what unlocks. */
  if (ref.kind === 'work') {
    const w = (model.works || []).find((x) => x.id === ref.id);
    if (!w) return h('div', { class: 'panel' }, 'gone');
    const opens = model.cases.filter((c) => condRefs(c.trigger).works.some((r) => r.work === w.id && !r.negated));
    const shuts = model.cases.filter((c) => condRefs(c.trigger).works.some((r) => r.work === w.id && r.negated));
    const chain = (model.works || []).filter((x) => x.needsWork && x.needsWork.id === w.id);
    const caseLink = (id) => h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('case', id); } }, id);
    return h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'a year of work' }),
      h('h4', { text: w.name }),
      h('p', { class: 'hint', text: w.line }),
      kv(
        'id',
        h('span', { class: 'mono' }, w.id),
        'stage',
        h('span', { class: 'mono' }, w.stage),
        'cost',
        h('span', { class: 'mono' }, w.cost + (w.townCost ? ' / ' + w.townCost + ' as a town' : '') + ' points'),
        'levels',
        h('span', { class: 'mono' }, String(w.maxLevel)),
        'waits on',
        h('span', { class: 'mono' }, w.needsWork ? w.needsWork.id + ' level ' + w.needsWork.level : (w.needsBoard ? 'the ' + w.needsBoard + ' board' : (w.needsLaw ? 'a law on ' + w.needsLaw : 'nothing'))),
        'opens the scenes',
        h('span', {}, opens.length ? opens.map((c) => h('span', { class: 'row' }, caseLink(c.id), h('span', { class: 'muted' }, c.title))) : h('span', { class: 'muted' }, 'none')),
        'keeps out',
        h('span', {}, shuts.length ? shuts.map((c) => caseLink(c.id)) : h('span', { class: 'muted' }, 'none')),
        'and then',
        h('span', {}, chain.length ? chain.map((x) => chip(x.name)) : h('span', { class: 'muted' }, 'nothing waits on it')),
      ),
    );
  }
  if (ref.kind === 'flag') {
    const setters = [];
    for (const c of model.cases) {
      for (const ch of c.choices) if ((ch.setFlags || []).includes(ref.id)) setters.push(c.id + ' / ' + ch.id);
    }
    const readers = model.cases.filter((c) => condRefs(c.trigger).flags.some((f) => f.flag === ref.id)).map((c) => c.id);
    return h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'story flag' }),
      h('h4', { text: ref.id }),
      kv( 'set by', h('span', {}, setters.join(', ') || '-'), 'read by', h('span', {}, readers.join(', ') || '-')),
    );
  }
  if (ref.kind === 'loop') {
    const loop = model.loops.find((l) => l.id === ref.id);
    const li = model.loops.indexOf(loop);
    return h(
      'div',
      { class: 'panel' },
      h('h2', { text: 'loop ' + loop.id }),
      kv(
        'armed when',
        h('span', { class: 'mono' }, condText(loop.arm)),
        'delay turns',
        numField({ source: 'loops', root: 'LOOPS', path: [li, 'delayTurns'] }, loop.delayTurns),
        'repeat every',
        loop.repeatEvery === undefined ? h('span', { class: 'muted' }, '-') : numField({ source: 'loops', root: 'LOOPS', path: [li, 'repeatEvery'] }, loop.repeatEvery),
        'max fires',
        numField({ source: 'loops', root: 'LOOPS', path: [li, 'maxFires'] }, loop.maxFires),
        'fires case',
        h('a', { href: '#', onclick: (e) => { e.preventDefault(); jumpTo('case', loop.caseId); } }, loop.caseId),
      ),
      h('p', { class: 'hint', text: 'The numbers here are written in src/content/loops.ts as references to CONFIG, so editing them writes the reference away. Prefer the engine dials on the Rates tab.' }),
    );
  }
  return h('div', { class: 'panel' }, 'unknown');
}

function enablePanZoom(wrap, svg, laid) {
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const apply = () => svg.__root.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ')');
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    tx = mx - (mx - tx) * f;
    ty = my - (my - ty) * f;
    scale *= f;
    apply();
  }, { passive: false });
  wrap.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    wrap.classList.add('drag');
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    wrap.classList.remove('drag');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    apply();
  });
  const fit = () => {
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;
    scale = Math.max(0.15, Math.min(rect.width / (laid.width + 40), rect.height / (laid.height + 40), 1));
    tx = 8;
    ty = 8;
    apply();
  };
  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };
  let fitted = false;
  const ro = new ResizeObserver(() => {
    if (fitted) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 50) return;
    fitted = true;
    fit();
  });
  ro.observe(wrap);
  return { fit, reset };
}

/* --------------------------------------------------------------- routing */

function jumpTo(kind, id) {
  if (kind === 'proposal') {
    sel.proposal = id;
    tab = 'laws';
  } else {
    sel.case = id;
    tab = 'cases';
  }
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x.dataset.tab === tab));
  render();
  window.scrollTo({ top: 0 });
}

boot().then(render).catch((e) => toast(String(e), true));

/* -------------------------------------------------------------- reign tab */

/**
 * Whole reigns, played through the real engine by `tools/reign.ts` and drawn
 * here. Nothing on this tab writes anything: it is the check to run after a
 * balance edit, before and after, to see what the change did to a reign.
 */
const reign = {
  players: ['best', 'comfortable', 'human', 'random'],
  seeds: '12',
  moments: '',
  mistake: 0.3,
  speed: 1,
  read: 1,
  timeline: true,
  busy: false,
  data: null,
  error: null,
  open: new Set(),
};

const REIGN_PLAYERS = [
  ['best', 'the most efficient: every answer tried, the boards kept level'],
  ['comfortable', 'the kindest answer every time, whatever it costs the crown'],
  ['human', 'best, with a share of wrong answers'],
  ['random', 'every answer drawn from a hat'],
  ['first', 'always the first answer'],
  ['middle', 'always the middle one'],
  ['last', 'always the last one'],
];

const STAT_SHORT = {
  crownSanity: 'C', mood: 'M', health: 'H', economy: 'E', army: 'W', culture: 'K',
};

async function runReign() {
  if (reign.busy) return;
  if (reign.players.length === 0) {
    toast('pick at least one player', true);
    return;
  }
  reign.busy = true;
  reign.error = null;
  render();
  try {
    reign.data = await api('/api/reign', {
      players: reign.players,
      seeds: reign.seeds,
      moments: reign.moments || undefined,
      mistake: reign.mistake,
      speed: reign.speed,
      read: reign.read,
      timeline: reign.timeline,
    });
    reign.open = new Set();
  } catch (e) {
    reign.error = String(e.message || e);
    reign.data = null;
  }
  reign.busy = false;
  render();
}

function reignControls() {
  const pills = h(
    'div',
    { class: 'reign-players' },
    REIGN_PLAYERS.map(([id, why]) => {
      const on = reign.players.includes(id);
      const box = h('input', { type: 'checkbox', checked: on || undefined });
      const label = h('label', { class: on ? 'on' : '', title: why }, box, id);
      box.addEventListener('change', () => {
        reign.players = box.checked
          ? [...reign.players, id]
          : reign.players.filter((p) => p !== id);
        render();
      });
      return label;
    }),
  );

  const field = (title, el) => h('label', { class: 'field' }, h('span', { text: title }), el);
  const num = (key, step, min, max) => {
    const el = h('input', {
      class: 'f', type: 'number', step, min, max, value: String(reign[key]),
    });
    el.addEventListener('change', () => {
      reign[key] = Number(el.value);
    });
    return el;
  };
  const seeds = h('input', { class: 'f', type: 'text', value: reign.seeds, size: 8 });
  seeds.addEventListener('change', () => {
    reign.seeds = seeds.value.trim();
  });
  const moments = h(
    'select',
    { class: 'f' },
    [['', 'each profile default'], ['all', 'all'], ['half', 'half'], ['none', 'none']].map(
      ([v, t]) => h('option', { value: v, selected: reign.moments === v || undefined }, t),
    ),
  );
  moments.addEventListener('change', () => {
    reign.moments = moments.value;
  });
  const timeline = h('input', { type: 'checkbox', checked: reign.timeline || undefined });
  timeline.addEventListener('change', () => {
    reign.timeline = timeline.checked;
  });

  const go = h('button', { class: 'btn primary' }, reign.busy ? 'playing...' : 'Play these reigns');
  go.addEventListener('click', runReign);
  if (reign.busy) go.setAttribute('disabled', '');

  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'Play whole reigns' }),
    h('p', {
      class: 'hint',
      text:
        'Every reign below is played through the real engine, the same reducer the ' +
        'game runs on. Nothing is written. Run it before a balance edit and again ' +
        'after, and the two tables say what the edit did.',
    }),
    pills,
    h(
      'div',
      { class: 'reign-bar', style: 'margin-top:12px' },
      field('seeds (n or a-b)', seeds),
      field('small things on the map', moments),
      field('human mistake', num('mistake', 0.05, 0, 1)),
      field('wheel speed', num('speed', 1, 1, 4)),
      field('reading x', num('read', 0.1, 0.1, 4)),
      h('label', { class: 'field' }, h('span', { text: 'timelines' }), timeline),
      go,
    ),
  );
}

function reignSummary(data) {
  const cols = [
    { title: 'player', get: (r) => r.player, cell: (r) => r.player },
    { title: 'small things', get: (r) => r.moments, cell: (r) => r.moments },
    { title: 'runs', num: true, get: (r) => r.runs, cell: (r) => String(r.runs) },
    { title: 'years', num: true, get: (r) => r.years, cell: (r) => r.years.toFixed(1) },
    { title: 'laws', num: true, get: (r) => r.laws, cell: (r) => r.laws.toFixed(1) },
    { title: 'cases', num: true, get: (r) => r.cases, cell: (r) => r.cases.toFixed(1) },
    { title: 'heavy', num: true, get: (r) => r.heavy, cell: (r) => r.heavy.toFixed(1) },
    { title: 'warm', num: true, get: (r) => r.warm, cell: (r) => r.warm.toFixed(1) },
    { title: 'empty years', num: true, get: (r) => r.empty, cell: (r) => r.empty.toFixed(1) },
    {
      title: 'small taken', num: true, get: (r) => r.momentsTaken,
      cell: (r) => r.momentsTaken.toFixed(1) + ' (+' + r.momentPoints.toFixed(1) + ')',
    },
    { title: 'minutes', num: true, get: (r) => r.minutes, cell: (r) => r.minutes.toFixed(0) },
    { title: 'endings', get: (r) => r.endings, cell: (r) => r.endings },
    { title: 'lowest board', get: (r) => r.lowest, cell: (r) => r.lowest },
    {
      title: 'final C M H E', get: (r) => r.final.mood,
      cell: (r) =>
        Math.round(r.final.crownSanity) + ' ' + Math.round(r.final.mood) + ' ' +
        Math.round(r.final.health) + ' ' + Math.round(r.final.economy),
    },
  ];
  return h(
    'div',
    { class: 'panel' },
    h('h2', { text: 'What each player did with the same content' }),
    table(cols, data.summary),
    h('p', {
      class: 'reign-note',
      text:
        'heavy = a scene the scheduler files at or under the urgent line; warm = one ' +
        'it files at 12 or above; minutes = the season wheel at the chosen speed plus ' +
        'a reading budget per card, so it is an estimate of time at the table.',
    }),
    data.never.length > 0
      ? h('p', {
          class: 'reign-note',
          text: 'never reached in any of these reigns: ' + data.never.join(', '),
        })
      : null,
  );
}

function statsCell(stats, boards, population) {
  const parts = boards.map(
    (b) => STAT_SHORT[b] + String(Math.round(stats[b])).padStart(2, ' '),
  );
  return parts.join(' ') + '  P' + population;
}

function reignTimeline(run) {
  const key = run.player + '/' + run.seed;
  const head = h(
    'button',
    { class: 'btn ghost', style: 'text-align:left' },
    'seed ' + run.seed + ' - ' + run.player + ' - ' + run.years.length + ' years, ' +
      run.cases + ' cases (' + run.heavy + ' heavy, ' + run.warm + ' warm), ' +
      run.emptyYears + ' empty, ' + run.ending + ', ~' + run.minutes.toFixed(0) + ' min',
  );
  head.addEventListener('click', () => {
    if (reign.open.has(key)) reign.open.delete(key);
    else reign.open.add(key);
    render();
  });
  const body = reign.open.has(key)
    ? h(
        'div',
        { class: 'reign-timeline' },
        run.years.map((y) => {
          const cls =
            y.events.length === 0 ? 'y-empty' : y.heavy > 0 ? 'y-heavy' : y.warm > 0 ? 'y-warm' : '';
          const ev = y.events.length ? y.events.join('   ') : '(nobody at the door)';
          const mo = y.moments.length ? '   +' + y.moments.join(' +') : '';
          return h('div', {
            class: cls,
            text:
              'y' + String(y.turn).padStart(2, ' ') + '  ' +
              statsCell(y.stats, y.boards, y.population) + '   ' + ev +
              '   WORK ' + (y.work || '-') + mo,
          });
        }),
        h('div', {
          class: 'reign-note',
          text:
            'lowest: ' + run.lowest.stat + ' ' + run.lowest.value + ' in year ' +
            run.lowest.turn + '.  final: ' +
            statsCell(run.finalStats, run.finalBoards, run.finalPopulation),
        }),
      )
    : null;
  return h('div', { class: 'panel' }, head, body);
}

function reignTab() {
  const out = h('div', {}, reignControls());
  if (reign.error) {
    out.append(h('div', { class: 'panel' }, h('pre', { text: reign.error })));
    return out;
  }
  if (!reign.data) {
    out.append(
      h('div', { class: 'panel' }, h('p', {
        class: 'hint',
        text:
          'Nothing played yet. The same thing on the command line is ' +
          'npm run reign, and it takes the same flags.',
      })),
    );
    return out;
  }
  out.append(reignSummary(reign.data));
  if (reign.data.args.timeline) {
    out.append(
      h('h2', { style: 'margin:18px 4px 6px', text: 'Year by year' }),
      ...reign.data.runs.map(reignTimeline),
    );
  }
  return out;
}
