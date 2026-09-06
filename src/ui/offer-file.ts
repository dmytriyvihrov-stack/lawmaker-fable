/**
 * Handing the player a file, wherever the page happens to be running.
 *
 * Served normally, a link with a `download` attribute is all it takes. Inside
 * the artifact viewer that link is inert: it does not save anything and it does
 * not throw either, so the old code looked like it had worked and had not. The
 * viewer mediates saving through a capability the page has to ask for, and the
 * person watching gets to say no.
 *
 * Nothing in `src/engine` knows this file exists.
 */

interface Downloads {
  save(request: { filename: string; data: Blob }): Promise<unknown>;
}

interface Host {
  use?(name: string): Promise<unknown>;
}

function host(): Host | undefined {
  return (window as unknown as { claude?: Host }).claude;
}

/** Whether the page is running inside a viewer that mediates saving. */
export function isMediated(): boolean {
  return typeof host()?.use === 'function';
}

export type Offer = 'saved' | 'declined' | 'unavailable';

export async function offerFile(filename: string, data: Blob): Promise<Offer> {
  const use = host()?.use;
  if (typeof use === 'function') {
    let downloads: Downloads | null = null;
    try {
      downloads = (await use('downloads')) as Downloads | null;
    } catch {
      return 'unavailable';
    }
    if (!downloads) return 'unavailable';
    try {
      await downloads.save({ filename, data });
      return 'saved';
    } catch (err) {
      // the viewer saying no is an answer, not a failure to route around
      const code = (err as { code?: string })?.code;
      return code === 'declined' ? 'declined' : 'unavailable';
    }
  }

  // served as an ordinary page: a link is the whole mechanism
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}
