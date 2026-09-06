/**
 * Writes one value back into a TypeScript source. Every patch re-reads and
 * re-parses the file first, so offsets are always fresh, and only the range of
 * that one value is replaced. Everything else in the file, comments included,
 * is left byte for byte as it was.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseModule, locate } from './parse.mjs';
import { readSource, SOURCES } from './content.mjs';

function literal(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('not a finite number');
    return String(value);
  }
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    const body = value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '')
      .replace(/\n/g, '\\n');
    return "'" + body + "'";
  }
  if (Array.isArray(value)) return '[' + value.map(literal).join(', ') + ']';
  if (typeof value === 'object') {
    const body = Object.entries(value)
      .map(([k, v]) => k + ': ' + literal(v))
      .join(', ');
    return body === '' ? '{}' : '{ ' + body + ' }';
  }
  throw new Error('cannot write a value of type ' + typeof value);
}

function indentOf(src, pos) {
  const lineStart = src.lastIndexOf('\n', pos - 1) + 1;
  const line = src.slice(lineStart, pos);
  const m = line.match(/^[ \t]*/);
  return m ? m[0] : '';
}

function backup(root, key, src) {
  const dir = join(root, 'tools', '.backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(dir, stamp + '.' + key + '.ts'), src, 'utf8');
}

/**
 * ops: [{ source, root, path, value }] with value === null meaning "remove the key".
 * All ops for one file are applied in a single pass, back to front.
 */
export function applyPatch(projectRoot, ops) {
  const byFile = new Map();
  for (const op of ops) {
    if (!SOURCES[op.source]) throw new Error('unknown source ' + op.source);
    if (!SOURCES[op.source].roots.includes(op.root)) {
      throw new Error('unknown root ' + op.root + ' in ' + op.source);
    }
    if (!byFile.has(op.source)) byFile.set(op.source, []);
    byFile.get(op.source).push(op);
  }

  const touched = [];
  for (const [source, fileOps] of byFile) {
    const { full, src } = readSource(projectRoot, source);
    const decls = parseModule(src, SOURCES[source].path);
    const edits = [];

    for (const op of fileOps) {
      const rootNode = decls.get(op.root);
      if (!rootNode) throw new Error('missing ' + op.root);
      const path = op.path.map((p) => (typeof p === 'number' ? p : String(p)));
      const found = locate(rootNode, path);

      if (found.node) {
        if (op.value === null && op.remove) {
          const parent = locate(rootNode, path.slice(0, -1)).node;
          const entry = parent.entries.find((e) => e.key === String(path[path.length - 1]));
          edits.push(removalEdit(src, parent, entry));
        } else {
          edits.push({ start: found.node.s, end: found.node.e, text: literal(op.value) });
        }
        continue;
      }

      if (found.missing.length !== 1) {
        throw new Error('no such value at ' + op.root + '.' + path.join('.'));
      }
      const parent = found.parent;
      if (!parent || parent.k !== 'obj') {
        throw new Error('cannot add ' + found.missing[0] + ': the target is not an object');
      }
      edits.push(insertionEdit(src, parent, found.missing[0], op.value));
    }

    edits.sort((a, b) => b.start - a.start);
    let out = src;
    for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    if (out !== src) {
      backup(projectRoot, source, src);
      writeFileSync(full, out, 'utf8');
      touched.push(SOURCES[source].path);
    }
  }
  return touched;
}

function insertionEdit(src, objNode, key, value) {
  const text = key + ': ' + literal(value);
  if (objNode.entries.length === 0) {
    return { start: objNode.s, end: objNode.e, text: '{ ' + text + ' }' };
  }
  const last = objNode.entries[objNode.entries.length - 1];
  const multiline = src.slice(objNode.s, objNode.e).includes('\n');
  if (!multiline) return { start: last.e, end: last.e, text: ', ' + text };
  const indent = indentOf(src, last.s);
  return { start: last.e, end: last.e, text: ',\n' + indent + text };
}

function removalEdit(src, objNode, entry) {
  const multiline = src.slice(objNode.s, objNode.e).includes('\n');
  let start = entry.s;
  let end = entry.e;

  let after = end;
  while (after < src.length && /[ \t]/.test(src[after])) after += 1;

  if (src[after] === ',') {
    // another entry follows: take this one and its comma
    end = after + 1;
    while (end < src.length && /[ \t]/.test(src[end])) end += 1;
    if (multiline) {
      if (src[end] === '\r') end += 1;
      if (src[end] === '\n') end += 1;
      const lineStart = src.lastIndexOf('\n', start - 1) + 1;
      if (/^[ \t]*$/.test(src.slice(lineStart, start))) start = lineStart;
    }
    return { start, end, text: '' };
  }

  // the last entry: the comma in front of it has to go with it
  let before = start;
  while (before > 0 && /[ \t\r\n]/.test(src[before - 1])) before -= 1;
  if (src[before - 1] === ',') return { start: before - 1, end, text: '' };

  // the only entry: leave an empty pair of braces
  while (start > 0 && /[ \t\r\n]/.test(src[start - 1])) start -= 1;
  while (end < src.length && /[ \t\r\n]/.test(src[end])) end += 1;
  return { start, end, text: '' };
}
