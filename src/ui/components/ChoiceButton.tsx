import type { ReactNode } from 'react';

interface Props {
  onClick: () => void;
  children: ReactNode;
  note?: ReactNode;
  disabled?: boolean;
}

export function ChoiceButton({ onClick, children, note, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="answer w-full min-h-[52px] rounded-md border border-ink-line bg-ink-soft px-4 py-3 text-left text-[15px] leading-snug text-parchment active:bg-ink-line disabled:opacity-40"
    >
      <span className="block">{children}</span>
      {note && <span className="mt-1 block text-[12px] text-seal">{note}</span>}
    </button>
  );
}
