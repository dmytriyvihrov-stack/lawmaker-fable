/**
 * A very small parser for the literal subset of TypeScript used by src/content.
 * It returns an AST with exact source offsets, so the console can both read the
 * data and write single values back without touching anything else in the file.
 *
 * Supported: object and array literals, single and double quoted strings,
 * numbers, booleans, null, undefined, identifiers and member chains
 * (CONFIG.feast.delayTurns), trailing commas, line and block comments.
 */

const ID_START = /[A-Za-z_$]/;
const ID_CHAR = /[A-Za-z0-9_$]/;

class Reader {
  constructor(src, file) {
    this.src = src;
    this.file = file;
    this.pos = 0;
  }

  fail(msg) {
    const line = this.src.slice(0, this.pos).split('\n').length;
    throw new Error(this.file + ':' + line + ': ' + msg);
  }

  trivia() {
    for (;;) {
      const c = this.src[this.pos];
      if (c === undefined) return;
      if (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
        this.pos += 1;
        continue;
      }
      if (c === '/' && this.src[this.pos + 1] === '/') {
        const nl = this.src.indexOf('\n', this.pos);
        this.pos = nl === -1 ? this.src.length : nl + 1;
        continue;
      }
      if (c === '/' && this.src[this.pos + 1] === '*') {
        const end = this.src.indexOf('*/', this.pos);
        this.pos = end === -1 ? this.src.length : end + 2;
        continue;
      }
      return;
    }
  }

  value() {
    this.trivia();
    const c = this.src[this.pos];
    if (c === undefined) this.fail('unexpected end of file');
    let node = null;
    if (c === '{') node = this.object();
    else if (c === '[') node = this.array();
    else if (c === "'" || c === '"') node = this.string();
    else if (c === '-' || (c >= '0' && c <= '9')) node = this.number();
    else if (ID_START.test(c)) node = this.word();
    else {
      this.fail('unexpected character ' + JSON.stringify(c));
      return null;
    }
    this.assertion();
    return node;
  }

  /**
   * A TypeScript type assertion after a value, which this parser reads and
   * throws away: the value is the same value either way.
   *
   * Without this, one `as const` anywhere inside an object stops the whole
   * declaration being read, and every tab that reads it opens empty. That is
   * exactly what had happened to `CONFIG`, on the one line that says which
   * speeds the wheel runs at.
   */
  assertion() {
    const SPACE = ' \t\r\n';
    const TYPE = '_$.<>[]| ';
    let i = this.pos;
    while (i < this.src.length && SPACE.includes(this.src[i])) i++;
    if (this.src.slice(i, i + 2) !== 'as') return;
    const after = this.src[i + 2];
    if (after === undefined || !SPACE.includes(after)) return;
    i += 2;
    while (i < this.src.length && SPACE.includes(this.src[i])) i++;
    const isType = (c) => /[A-Za-z0-9]/.test(c) || TYPE.includes(c);
    let end = i;
    while (end < this.src.length && isType(this.src[end])) end++;
    // a trailing space belongs to whatever comes next, not to the type
    while (end > i && this.src[end - 1] === ' ') end--;
    if (end === i) return;
    this.pos = end;
  }

  object() {
    const s = this.pos;
    this.pos += 1;
    const entries = [];
    for (;;) {
      this.trivia();
      if (this.src[this.pos] === '}') {
        this.pos += 1;
        break;
      }
      const entryStart = this.pos;
      const ks = this.pos;
      let key;
      const c = this.src[this.pos];
      if (c === "'" || c === '"') {
        key = this.string().v;
      } else if (ID_START.test(c)) {
        while (this.pos < this.src.length && ID_CHAR.test(this.src[this.pos])) this.pos += 1;
        key = this.src.slice(ks, this.pos);
      } else {
        this.fail('expected an object key');
      }
      const ke = this.pos;
      this.trivia();
      if (this.src[this.pos] === '?') this.pos += 1;
      if (this.src[this.pos] !== ':') this.fail('expected a colon after key ' + key);
      this.pos += 1;
      const v = this.value();
      entries.push({ key, ks, ke, v, s: entryStart, e: this.pos });
      this.trivia();
      if (this.src[this.pos] === ',' || this.src[this.pos] === ';') this.pos += 1;
      else if (this.src[this.pos] === '}') {
        this.pos += 1;
        break;
      } else this.fail('expected a comma or a closing brace');
    }
    return { k: 'obj', s, e: this.pos, entries };
  }

  array() {
    const s = this.pos;
    this.pos += 1;
    const items = [];
    for (;;) {
      this.trivia();
      if (this.src[this.pos] === ']') {
        this.pos += 1;
        break;
      }
      items.push(this.value());
      this.trivia();
      if (this.src[this.pos] === ',') this.pos += 1;
      else if (this.src[this.pos] === ']') {
        this.pos += 1;
        break;
      } else this.fail('expected a comma or a closing bracket');
    }
    return { k: 'arr', s, e: this.pos, items };
  }

  string() {
    const s = this.pos;
    const quote = this.src[this.pos];
    this.pos += 1;
    let out = '';
    for (;;) {
      const c = this.src[this.pos];
      if (c === undefined) this.fail('unterminated string');
      if (c === '\\') {
        const n = this.src[this.pos + 1];
        if (n === 'n') out += '\n';
        else if (n === 't') out += '\t';
        else if (n === 'r') out += '\r';
        else if (n === '\n') out += '';
        else out += n;
        this.pos += 2;
        continue;
      }
      if (c === quote) {
        this.pos += 1;
        break;
      }
      out += c;
      this.pos += 1;
    }
    return { k: 'str', s, e: this.pos, v: out, quote };
  }

  number() {
    const s = this.pos;
    if (this.src[this.pos] === '-') this.pos += 1;
    while (this.pos < this.src.length && /[0-9._eE+]/.test(this.src[this.pos])) this.pos += 1;
    const raw = this.src.slice(s, this.pos).replace(/_/g, '');
    return { k: 'num', s, e: this.pos, v: Number(raw) };
  }

  word() {
    const s = this.pos;
    while (this.pos < this.src.length && ID_CHAR.test(this.src[this.pos])) this.pos += 1;
    const name = this.src.slice(s, this.pos);
    if (name === 'true' || name === 'false') {
      return { k: 'bool', s, e: this.pos, v: name === 'true' };
    }
    if (name === 'null') return { k: 'null', s, e: this.pos, v: null };
    if (name === 'undefined') return { k: 'undef', s, e: this.pos, v: undefined };
    const path = [name];
    for (;;) {
      const save = this.pos;
      this.trivia();
      if (this.src[this.pos] !== '.') {
        this.pos = save;
        break;
      }
      this.pos += 1;
      this.trivia();
      const ps = this.pos;
      while (this.pos < this.src.length && ID_CHAR.test(this.src[this.pos])) this.pos += 1;
      if (ps === this.pos) this.fail('expected a property name');
      path.push(this.src.slice(ps, this.pos));
    }
    return { k: 'ref', s, e: this.pos, path };
  }
}

const DECL = /^(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::[^=]*?)?\s*=\s*/gm;

/** Parses every top level const literal in a module. */
export function parseModule(src, file) {
  const decls = new Map();
  DECL.lastIndex = 0;
  let m;
  while ((m = DECL.exec(src)) !== null) {
    const reader = new Reader(src, file);
    reader.pos = m.index + m[0].length;
    const head = src[reader.pos];
    if (head === undefined) continue;
    if (!'{["\''.includes(head) && !/[-0-9]/.test(head)) continue;
    let node = null;
    try {
      node = reader.value();
    } catch (err) {
      /* A value this parser cannot read is skipped rather than fatal, so one
         new piece of syntax never blackens the whole console. It is not silent
         any more: PARSE_DEBUG=1 says which declaration was dropped and why,
         which is how a console that had quietly stopped reading config.ts got
         found. */
      if (process.env.PARSE_DEBUG) {
        console.error('parse: dropped ' + m[1] + ' in ' + file + ': ' + err.message);
      }
      node = null;
    }
    if (node === null) continue;
    decls.set(m[1], node);
    DECL.lastIndex = Math.max(DECL.lastIndex, reader.pos);
  }
  return decls;
}

/** Turns an AST node into a plain value. `env` resolves identifier references. */
export function toValue(node, env) {
  const scope = env || {};
  switch (node.k) {
    case 'obj': {
      const out = {};
      for (const en of node.entries) out[en.key] = toValue(en.v, scope);
      return out;
    }
    case 'arr':
      return node.items.map((n) => toValue(n, scope));
    case 'ref': {
      let cur = scope;
      for (const step of node.path) {
        if (cur === undefined || cur === null) return undefined;
        cur = cur[step];
      }
      return cur;
    }
    default:
      return node.v;
  }
}

/** Walks a value path (array index or object key) down to the node holding it. */
export function locate(root, path) {
  let node = root;
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    if (node.k === 'arr') {
      const next = node.items[Number(step)];
      if (!next) return { node: null, parent: node, missing: path.slice(i) };
      node = next;
    } else if (node.k === 'obj') {
      const en = node.entries.find((e) => e.key === String(step));
      if (!en) return { node: null, parent: node, missing: path.slice(i) };
      node = en.v;
    } else {
      return { node: null, parent: node, missing: path.slice(i) };
    }
  }
  return { node, parent: null, missing: [] };
}
