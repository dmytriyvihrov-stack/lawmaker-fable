import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MiniApp } from './MiniApp';
import { TechBench } from './tech/TechBench';
import '../index.css';

/**
 * Two benches behind one file. The hash says which: `#tree` is the tree as a
 * choice, anything else is the hand. Each bench carries a link to the other,
 * and the page never reloads to switch.
 */
type Bench = 'hand' | 'tree';

function benchOf(hash: string): Bench {
  return hash === '#tree' ? 'tree' : 'hand';
}

function Benches() {
  const [bench, setBench] = useState<Bench>(() => benchOf(window.location.hash));
  useEffect(() => {
    const read = () => setBench(benchOf(window.location.hash));
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return bench === 'tree' ? <TechBench /> : <MiniApp />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <Benches />
  </StrictMode>,
);
