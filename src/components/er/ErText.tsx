import type { ErTextPart } from '../../lib/erText';

/** A sentence made of plain text and code names. Everything is rendered as text by React, never as markup. */
export function ErSentence({ parts }: { parts: ErTextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <code key={index} className="font-mono text-[12px] bg-white px-1.5 py-px rounded border border-[#E5DFD3]">
            {part.code}
          </code>
        ),
      )}
    </>
  );
}
