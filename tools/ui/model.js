/**
 * Everything derived from the raw content: readable conditions, the flat table
 * of every number in the game, the stat influence graph and the dependency
 * tree. Nothing here writes: it only reads the model the server sent.
 */

export const STAT_IDS = ['treasury', 'health', 'mood', 'sanity'];

export function lawId(o) {
  return o.subject + '_' + o.action;
}

/* ---------------------------------------------------------------- conditions */

export function condText(c) {
  if (!c) return 'no trigger (arrives only from a loop or a schedule)';
  switch (c.kind) {
    case 'always':
      return 'always';
    case 'lawActive':
      return 'law ' + lawPattern(c) + ' is active';
    case 'lawEver':
      return 'law ' + lawPattern(c) + ' was ever passed';
    case 'stat':
      return c.stat + ' ' + (c.op === 'lte' ? '<=' : '>=') + ' ' + c.value;
    case 'flag':
      return 'flag ' + c.flag;
    case 'caseShown':
      return 'case ' + c.caseId + ' was shown';
    case 'turn':
      return 'turn ' + (c.op === 'lte' ? '<=' : '>=') + ' ' + c.value;
    case 'not':
      return 'NOT (' + condText(c.cond) + ')';
    case 'all':
      return '(' + c.conds.map(condText).join(' AND ') + ')';
    case 'any':
      return '(' + c.conds.map(condText).join(' OR ') + ')';
    default:
      return JSON.stringify(c);
  }
}

function lawPattern(c) {
  const s = c.subject || 'any';
  const a = c.action || 'any';
  return s + ' / ' + a;
}

/** Walks a condition and reports everything it reads. */
export function condRefs(cond, out, negated) {
  const acc = out || { stats: [], laws: [], flags: [], cases: [], turns: [] };
  const neg = negated === true;
  if (!cond) return acc;
  switch (cond.kind) {
    case 'stat':
      acc.stats.push({ stat: cond.stat, op: cond.op, value: cond.value, negated: neg });
      break;
    case 'lawActive':
    case 'lawEver':
      acc.laws.push({
        subject: cond.subject,
        action: cond.action,
        kind: cond.kind,
        negated: neg,
      });
      break;
    case 'flag':
      acc.flags.push({ flag: cond.flag, negated: neg });
      break;
    case 'caseShown':
      acc.cases.push({ caseId: cond.caseId, negated: neg });
      break;
    case 'turn':
      acc.turns.push({ op: cond.op, value: cond.value, negated: neg });
      break;
    case 'not':
      condRefs(cond.cond, acc, !neg);
      break;
    case 'all':
    case 'any':
      for (const c of cond.conds) condRefs(c, acc, neg);
      break;
    default:
      break;
  }
  return acc;
}

/* -------------------------------------------------------------- law registry */

/** Every law option in the game: the seven proposals plus decrees from cases. */
export function lawOptions(model) {
  const out = [];
  model.proposals.forEach((p, pi) => {
    p.options.forEach((o, oi) => {
      out.push({
        key: 'law:' + p.id + ':' + oi,
        option: o,
        id: lawId(o),
        origin: 'proposal',
        proposal: p,
        act: p.act,
        source: 'proposals',
        root: 'PROPOSALS',
        path: [pi, 'options', oi],
      });
    });
  });
  model.cases.forEach((c, ci) => {
    c.choices.forEach((ch, chi) => {
      if (!ch.enactLaw) return;
      out.push({
        key: 'decree:' + c.id + ':' + ch.id,
        option: ch.enactLaw,
        id: lawId(ch.enactLaw),
        origin: 'decree',
        caseEvent: c,
        choice: ch,
        act: null,
        source: 'cases',
        root: 'CASES',
        path: [ci, 'choices', chi, 'enactLaw'],
      });
    });
  });
  return out;
}

/* ------------------------------------------------------------- effect tables */

/**
 * One row per number that moves a board. `path` points at the value in the
 * source, so every row in the table is directly editable.
 */
export function effectRows(model) {
  const rows = [];
  const push = (row) => rows.push(row);

  model.proposals.forEach((p, pi) => {
    p.options.forEach((o, oi) => {
      for (const stat of STAT_IDS) {
        if (o.effects && o.effects[stat] !== undefined) {
          push({
            kind: 'law',
            when: 'on seal',
            stat,
            value: o.effects[stat],
            ownerId: p.id,
            ownerLabel: p.title,
            detail: o.label,
            lawId: lawId(o),
            tags: o.tags || [],
            act: p.act,
            badIdea: o.isBadIdea === true,
            source: 'proposals',
            root: 'PROPOSALS',
            path: [pi, 'options', oi, 'effects', stat],
            objectPath: [pi, 'options', oi, 'effects'],
          });
        }
        if (o.perTurn && o.perTurn[stat] !== undefined) {
          push({
            kind: 'law',
            when: 'per turn',
            stat,
            value: o.perTurn[stat],
            ownerId: p.id,
            ownerLabel: p.title,
            detail: o.label,
            lawId: lawId(o),
            tags: o.tags || [],
            act: p.act,
            badIdea: o.isBadIdea === true,
            source: 'proposals',
            root: 'PROPOSALS',
            path: [pi, 'options', oi, 'perTurn', stat],
            objectPath: [pi, 'options', oi, 'perTurn'],
          });
        }
      }
    });
  });

  model.cases.forEach((c, ci) => {
    c.choices.forEach((ch, chi) => {
      for (const stat of STAT_IDS) {
        if (ch.effects && ch.effects[stat] !== undefined) {
          push({
            kind: 'case',
            when: 'on choice',
            stat,
            value: ch.effects[stat],
            ownerId: c.id,
            ownerLabel: c.title,
            detail: ch.text,
            tags: ch.tags || [],
            character: c.character || '',
            priority: c.priority,
            source: 'cases',
            root: 'CASES',
            path: [ci, 'choices', chi, 'effects', stat],
            objectPath: [ci, 'choices', chi, 'effects'],
          });
        }
        if (ch.enactLaw && ch.enactLaw.effects && ch.enactLaw.effects[stat] !== undefined) {
          push({
            kind: 'decree',
            when: 'on seal',
            stat,
            value: ch.enactLaw.effects[stat],
            ownerId: c.id,
            ownerLabel: c.title,
            detail: ch.enactLaw.label,
            lawId: lawId(ch.enactLaw),
            tags: ch.enactLaw.tags || [],
            source: 'cases',
            root: 'CASES',
            path: [ci, 'choices', chi, 'enactLaw', 'effects', stat],
            objectPath: [ci, 'choices', chi, 'enactLaw', 'effects'],
          });
        }
      }
      if (ch.exceptionToLaw) {
        push({
          kind: 'exception',
          when: 'automatic',
          stat: 'sanity',
          value: -(model.config.exceptionSanityCost || 0),
          readOnly: true,
          ownerId: c.id,
          ownerLabel: c.title,
          detail: 'exception to ' + ch.exceptionToLaw + ' for ' + (ch.beneficiary || '?'),
          tags: ch.tags || [],
          source: 'config',
          root: 'CONFIG',
          path: ['exceptionSanityCost'],
        });
      }
    });
  });

  return rows;
}

export function statSummary(rows) {
  const out = {};
  for (const stat of STAT_IDS) {
    out[stat] = { count: 0, up: 0, down: 0, net: 0, perTurn: 0, min: 0, max: 0 };
  }
  for (const r of rows) {
    const s = out[r.stat];
    if (!s) continue;
    s.count += 1;
    if (r.value > 0) s.up += r.value;
    else s.down += r.value;
    s.net += r.value;
    if (r.when === 'per turn') s.perTurn += r.value;
    s.min = Math.min(s.min, r.value);
    s.max = Math.max(s.max, r.value);
  }
  return out;
}

/* ---------------------------------------------------------- influence graph */

/**
 * A board moves another board only through a gate: a stat threshold in a
 * trigger opens an event, and that event's answers move other boards. Every
 * such path becomes one link here.
 */
export function influenceLinks(model) {
  const links = [];

  const addFromEvent = (gates, eventLabel, eventId, eventKind, effectsList) => {
    if (gates.length === 0) return;
    for (const g of gates) {
      for (const eff of effectsList) {
        for (const stat of STAT_IDS) {
          const v = eff.effects && eff.effects[stat];
          if (v === undefined || v === 0) continue;
          links.push({
            from: g.stat,
            to: stat,
            gate: g,
            value: v,
            eventId,
            eventKind,
            eventLabel,
            via: eff.label,
          });
        }
      }
    }
  };

  for (const c of model.cases) {
    const gates = condRefs(c.trigger).stats;
    addFromEvent(
      gates,
      c.title,
      c.id,
      'case',
      c.choices.map((ch) => ({ label: ch.text, effects: ch.effects })),
    );
  }

  for (const p of model.proposals) {
    const gates = condRefs(p.unlockedBy).stats;
    addFromEvent(
      gates,
      p.title,
      p.id,
      'proposal',
      p.options.map((o) => ({ label: o.label, effects: o.effects })),
    );
  }

  for (const loop of model.loops) {
    const gates = condRefs(loop.arm).stats;
    const target = model.cases.find((c) => c.id === loop.caseId);
    if (!target) continue;
    addFromEvent(
      gates,
      'loop ' + loop.id + ' -> ' + target.title,
      target.id,
      'case',
      target.choices.map((ch) => ({ label: ch.text, effects: ch.effects })),
    );
  }

  return links;
}

export function influenceMatrix(links) {
  const m = {};
  for (const a of STAT_IDS) {
    m[a] = {};
    for (const b of STAT_IDS) m[a][b] = { count: 0, net: 0, links: [] };
  }
  for (const l of links) {
    const cell = m[l.from] && m[l.from][l.to];
    if (!cell) continue;
    cell.count += 1;
    cell.net += l.value;
    cell.links.push(l);
  }
  return m;
}

/* ------------------------------------------------------------ dependency tree */

/**
 * Nodes: proposals, law options, cases, story flags, loops.
 * Edges: what puts what on the table.
 */
export function buildTree(model, opts) {
  const options = opts || {};
  const nodes = new Map();
  const edges = [];

  const add = (id, node) => {
    if (!nodes.has(id)) nodes.set(id, { id, ...node });
    return nodes.get(id);
  };
  const link = (from, to, kind, label) => {
    if (!nodes.has(from) || !nodes.has(to)) return;
    edges.push({ from, to, kind, label: label || '' });
  };

  const laws = lawOptions(model);

  for (const p of model.proposals) {
    add('p:' + p.id, {
      type: 'proposal',
      label: p.title,
      sub: 'act ' + p.act + ' / ' + p.advisor,
      act: p.act,
      ref: { kind: 'proposal', id: p.id },
    });
  }
  for (const l of laws) {
    add('l:' + l.key, {
      type: l.origin === 'decree' ? 'decree' : 'law',
      label: l.option.label,
      sub: l.id + (l.option.isBadIdea ? ' / bad idea' : ''),
      act: l.act,
      ref: { kind: 'law', key: l.key },
    });
    if (l.origin === 'proposal') link('p:' + l.proposal.id, 'l:' + l.key, 'option');
  }
  for (const c of model.cases) {
    add('c:' + c.id, {
      type: 'case',
      label: c.title,
      sub: c.id + ' / p' + c.priority + (c.trigger === null ? ' / called' : ''),
      ref: { kind: 'case', id: c.id },
    });
  }
  if (options.showFlags !== false) {
    const flags = new Set();
    for (const c of model.cases) {
      for (const ch of c.choices) for (const f of ch.setFlags || []) flags.add(f);
    }
    for (const c of model.cases) for (const f of condRefs(c.trigger).flags) flags.add(f.flag);
    for (const p of model.proposals) for (const f of condRefs(p.unlockedBy).flags) flags.add(f.flag);
    for (const f of flags) {
      add('f:' + f, { type: 'flag', label: f, sub: 'story flag', ref: { kind: 'flag', id: f } });
    }
  }
  for (const loop of model.loops) {
    add('o:' + loop.id, {
      type: 'loop',
      label: 'loop ' + loop.id,
      sub: 'after ' + loop.delayTurns + ' turns, max ' + loop.maxFires,
      ref: { kind: 'loop', id: loop.id },
    });
  }

  const lawMatches = (ref) =>
    laws.filter(
      (l) =>
        (ref.subject === undefined || l.option.subject === ref.subject) &&
        (ref.action === undefined || l.option.action === ref.action),
    );

  // triggers of cases
  for (const c of model.cases) {
    const refs = condRefs(c.trigger);
    for (const r of refs.laws) {
      for (const l of lawMatches(r)) {
        link('l:' + l.key, 'c:' + c.id, r.negated ? 'blocks' : 'unlocks', condLabel(r));
      }
    }
    for (const f of refs.flags) link('f:' + f.flag, 'c:' + c.id, f.negated ? 'blocks' : 'unlocks');
    for (const s of refs.cases) link('c:' + s.caseId, 'c:' + c.id, s.negated ? 'blocks' : 'unlocks');
  }

  // unlocks of proposals
  for (const p of model.proposals) {
    const refs = condRefs(p.unlockedBy);
    for (const r of refs.laws) {
      for (const l of lawMatches(r)) {
        link('l:' + l.key, 'p:' + p.id, r.negated ? 'blocks' : 'unlocks', condLabel(r));
      }
    }
    for (const f of refs.flags) link('f:' + f.flag, 'p:' + p.id, f.negated ? 'blocks' : 'unlocks');
    for (const s of refs.cases) link('c:' + s.caseId, 'p:' + p.id, s.negated ? 'blocks' : 'unlocks');
  }

  // what the answers do
  model.cases.forEach((c) => {
    c.choices.forEach((ch) => {
      for (const f of ch.setFlags || []) link('c:' + c.id, 'f:' + f, 'sets', ch.text);
      if (ch.schedule) {
        link('c:' + c.id, 'c:' + ch.schedule.caseId, 'schedules', '+' + ch.schedule.inTurns + ' turns');
      }
      if (ch.enactLaw) {
        const l = laws.find((x) => x.choice === ch && x.caseEvent === c);
        if (l) link('c:' + c.id, 'l:' + l.key, 'decrees', ch.text);
      }
      if (ch.repealSubject) {
        for (const l of lawMatches({ subject: ch.repealSubject })) {
          link('c:' + c.id, 'l:' + l.key, 'repeals', ch.text);
        }
      }
    });
  });

  // loops
  for (const loop of model.loops) {
    const refs = condRefs(loop.arm);
    for (const r of refs.laws) for (const l of lawMatches(r)) link('l:' + l.key, 'o:' + loop.id, 'arms');
    for (const f of refs.flags) link('f:' + f.flag, 'o:' + loop.id, 'arms');
    link('o:' + loop.id, 'c:' + loop.caseId, 'fires');
  }

  return { nodes: [...nodes.values()], edges };
}

function condLabel(r) {
  return (r.negated ? 'not ' : '') + (r.subject || 'any') + '/' + (r.action || 'any');
}

/** Layered left to right layout with a few barycentre passes. */
export function layoutTree(tree) {
  const index = new Map(tree.nodes.map((n, i) => [n.id, i]));
  const layer = tree.nodes.map((n) => (n.type === 'proposal' ? Math.max(0, (n.act || 1) - 1) : 0));

  // The content loops back on itself (a case can decree a law that opens the
  // case again), so the back edges are found first and left out of the ranking.
  const forward = tree.edges.filter((e) => index.has(e.from) && index.has(e.to));
  const out = new Map(tree.nodes.map((n, i) => [i, []]));
  forward.forEach((e, ei) => out.get(index.get(e.from)).push({ ei, to: index.get(e.to) }));
  const state = new Array(tree.nodes.length).fill(0);
  const back = new Set();
  const walk = (i) => {
    state[i] = 1;
    for (const edge of out.get(i)) {
      if (state[edge.to] === 1) back.add(edge.ei);
      else if (state[edge.to] === 0) walk(edge.to);
    }
    state[i] = 2;
  };
  for (let i = 0; i < tree.nodes.length; i++) if (state[i] === 0) walk(i);
  const ranked = forward.filter((_, ei) => !back.has(ei));

  for (let pass = 0; pass < tree.nodes.length; pass++) {
    let moved = false;
    for (const e of ranked) {
      const a = index.get(e.from);
      const b = index.get(e.to);
      if (layer[b] < layer[a] + 1) {
        layer[b] = layer[a] + 1;
        moved = true;
      }
    }
    if (!moved) break;
  }

  const byLayer = new Map();
  tree.nodes.forEach((n, i) => {
    const l = layer[i];
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l).push(i);
  });

  const order = new Map();
  for (const [l, list] of byLayer) list.forEach((i, k) => order.set(i, k));

  for (let pass = 0; pass < 6; pass++) {
    for (const [, list] of byLayer) {
      const bary = new Map();
      for (const i of list) {
        const neighbours = [];
        for (const e of tree.edges) {
          if (index.get(e.to) === i && index.get(e.from) !== undefined) {
            neighbours.push(order.get(index.get(e.from)) ?? 0);
          }
          if (index.get(e.from) === i && index.get(e.to) !== undefined) {
            neighbours.push(order.get(index.get(e.to)) ?? 0);
          }
        }
        bary.set(i, neighbours.length ? neighbours.reduce((a, b) => a + b, 0) / neighbours.length : order.get(i) ?? 0);
      }
      list.sort((a, b) => (bary.get(a) ?? 0) - (bary.get(b) ?? 0));
      list.forEach((i, k) => order.set(i, k));
    }
  }

  const colWidth = 260;
  const rowHeight = 66;
  const placed = tree.nodes.map((n, i) => ({
    ...n,
    layer: layer[i],
    x: 40 + layer[i] * colWidth,
    y: 40 + (order.get(i) ?? 0) * rowHeight,
  }));
  const width = 40 + (Math.max(...layer, 0) + 1) * colWidth + 220;
  const height = 80 + Math.max(...[...byLayer.values()].map((l) => l.length), 1) * rowHeight;
  return { nodes: placed, edges: tree.edges, width, height };
}

/* ----------------------------------------------------------------- warnings */

export function warnings(model) {
  const out = [];
  const rows = effectRows(model);
  const cfg = model.config;

  for (const r of rows) {
    if (r.readOnly) continue;
    if (r.value < cfg.effectMin || r.value > cfg.effectMax) {
      out.push({
        level: 'error',
        text:
          r.ownerId + ' / ' + r.detail + ': ' + r.stat + ' ' + r.value + ' is outside ' + cfg.effectMin + '..' + cfg.effectMax,
      });
    }
  }

  const caseIds = new Set(model.cases.map((c) => c.id));
  for (const c of model.cases) {
    for (const ch of c.choices) {
      if (ch.schedule && !caseIds.has(ch.schedule.caseId)) {
        out.push({ level: 'error', text: c.id + ' schedules a missing case ' + ch.schedule.caseId });
      }
      if (ch.exceptionToLaw && !ch.beneficiary) {
        out.push({ level: 'error', text: c.id + ' / ' + ch.id + ' has an exception with no beneficiary' });
      }
    }
    for (const ref of condRefs(c.trigger).cases) {
      if (!caseIds.has(ref.caseId)) {
        out.push({ level: 'error', text: c.id + ' is triggered by a missing case ' + ref.caseId });
      }
    }
    const grammar = model.verdicts.cases[c.id];
    if (!grammar) {
      out.push({ level: 'warn', text: c.id + ' has no ruling grammar on the bench' });
    } else {
      const ruled = new Set(grammar.rulings.map((r) => r.choiceId));
      for (const ch of c.choices) {
        if (!ruled.has(ch.id)) {
          out.push({ level: 'warn', text: c.id + ' / ' + ch.id + ' cannot be written at the bench' });
        }
      }
      for (const r of grammar.rulings) {
        if (!c.choices.some((ch) => ch.id === r.choiceId)) {
          out.push({ level: 'error', text: c.id + ': ruling points at a missing answer ' + r.choiceId });
        }
      }
    }
  }

  const aftermathIds = new Set(model.aftermaths.map((a) => a.id));
  for (const l of lawOptions(model)) {
    if (!aftermathIds.has(l.option.aftermathId)) {
      out.push({ level: 'error', text: l.option.label + ' points at a missing scene ' + l.option.aftermathId });
    }
  }
  for (const p of model.proposals) {
    const bad = p.options.filter((o) => o.isBadIdea).length;
    if (bad !== 1) out.push({ level: 'warn', text: p.id + ' has ' + bad + ' bad ideas, expected exactly one' });
  }

  const touched = new Set(rows.map((r) => r.stat));
  for (const s of STAT_IDS) if (!touched.has(s)) out.push({ level: 'warn', text: 'nothing moves ' + s });

  return out;
}
