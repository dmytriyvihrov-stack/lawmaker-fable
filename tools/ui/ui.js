/** Tiny DOM helpers, the staged edit store and the editable fields. */

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  const a = attrs || {};
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.setAttribute('style', v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat(3)) {
    if (kid === undefined || kid === null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const store = {
  model: null,
  pending: new Map(),
  onChange: () => {},

  key(op) {
    return op.source + '|' + op.root + '|' + op.path.join('.');
  },

  /** The value the user sees: a staged edit wins over the file. */
  valueOf(op, fallback) {
    const k = this.key(op);
    return this.pending.has(k) ? this.pending.get(k).value : fallback;
  },

  isStaged(op) {
    return this.pending.has(this.key(op));
  },

  stage(op, value, original) {
    const k = this.key(op);
    if (value === original) this.pending.delete(k);
    else this.pending.set(k, { ...op, value, original });
    this.onChange();
  },

  clear() {
    this.pending.clear();
    this.onChange();
  },

  ops() {
    return [...this.pending.values()].map((p) => ({
      source: p.source,
      root: p.root,
      path: p.path,
      value: p.value,
      remove: p.remove === true,
    }));
  },
};

export function numField(op, current, opts) {
  const o = opts || {};
  const shown = store.valueOf(op, current);
  const el = h('input', {
    class: 'f',
    type: 'number',
    step: o.step || 1,
    value: shown === undefined || shown === null ? '' : String(shown),
    title: op.source + ' ' + op.path.join('.'),
  });
  if (o.readOnly) {
    el.setAttribute('readonly', '');
    el.classList.add('muted');
    return el;
  }
  const paint = () => {
    el.classList.toggle('staged', store.isStaged(op));
    const v = Number(el.value);
    const bad = (o.min !== undefined && v < o.min) || (o.max !== undefined && v > o.max);
    el.classList.toggle('bad', el.value !== '' && bad);
  };
  paint();
  el.addEventListener('change', () => {
    if (el.value === '') {
      store.stage({ ...op, remove: true }, null, current);
    } else {
      store.stage(op, Number(el.value), current);
    }
    paint();
  });
  return el;
}

export function textField(op, current, opts) {
  const o = opts || {};
  const shown = store.valueOf(op, current);
  const el = h(o.area ? 'textarea' : 'input', {
    class: 'f text' + (o.area ? '' : ''),
    value: o.area ? undefined : shown ?? '',
    title: op.source + ' ' + op.path.join('.'),
  });
  if (o.area) el.value = shown ?? '';
  else el.value = shown ?? '';
  const paint = () => el.classList.toggle('staged', store.isStaged(op));
  paint();
  el.addEventListener('change', () => {
    store.stage(op, el.value, current);
    paint();
  });
  return el;
}

export function selectField(op, current, options) {
  const shown = store.valueOf(op, current);
  const el = h(
    'select',
    { class: 'f', title: op.source + ' ' + op.path.join('.') },
    options.map((o) =>
      h('option', { value: o, selected: o === shown ? true : undefined }, o),
    ),
  );
  el.value = shown;
  const paint = () => el.classList.toggle('staged', store.isStaged(op));
  paint();
  el.addEventListener('change', () => {
    store.stage(op, el.value, current);
    paint();
  });
  return el;
}

/** A two column label / value list. Plain strings become their own cell. */
export function kv(...items) {
  const cells = items
    .flat(4)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => (x instanceof Node && x.nodeType === 1 ? x : h('div', {}, x)));
  return h('div', { class: 'kv' }, cells);
}

export function chip(text, kind) {
  return h('span', { class: 'chip' + (kind ? ' ' + kind : '') }, text);
}

export function signed(v) {
  const s = v > 0 ? '+' + v : String(v);
  return h('span', { class: v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted' }, s);
}

export function toast(message, isError) {
  const el = h('div', { class: 'toast' + (isError ? ' err' : ''), text: message });
  document.body.append(el);
  setTimeout(() => el.remove(), isError ? 9000 : 3500);
}

export function api(path, body) {
  return fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
    return data;
  });
}

/** Sortable table. columns: [{title, num, get(row), cell(row)}] */
export function table(columns, rows, opts) {
  const o = opts || {};
  let sortIdx = o.sortIdx ?? -1;
  let dir = o.dir || 1;
  const body = h('tbody');

  const draw = () => {
    const data = [...rows];
    if (sortIdx >= 0 && columns[sortIdx].get) {
      data.sort((a, b) => {
        const va = columns[sortIdx].get(a);
        const vb = columns[sortIdx].get(b);
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    body.replaceChildren(
      ...data.map((row) =>
        h(
          'tr',
          { onclick: o.onRow ? () => o.onRow(row) : undefined },
          columns.map((c) => h('td', { class: c.num ? 'num' : undefined }, c.cell(row))),
        ),
      ),
    );
  };

  const head = h(
    'tr',
    {},
    columns.map((c, i) =>
      h(
        'th',
        {
          class: c.num ? 'num' : undefined,
          onclick: () => {
            if (sortIdx === i) dir = -dir;
            else {
              sortIdx = i;
              dir = 1;
            }
            draw();
          },
        },
        c.title,
      ),
    ),
  );
  draw();
  return h('table', {}, h('thead', {}, head), body);
}
