import React from 'react';

export function FormattedContent({
  text,
  className = ''
}: {
  text: string;
  className?: string;
}) {
  const normalized = (text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return null;

  const blocks = normalized.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  return (
    <div className={`space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base ${className}`}>
      {blocks.map((block, idx) => {
        const lines = block
          .split('\n')
          .map((l) => l.trimEnd())
          .filter((l) => l.trim().length > 0);

        if (lines.length === 1) {
          const single = lines[0].trim();
          if (single.startsWith('### ')) {
            return (
              <h4 key={idx} className="pt-2 font-heading text-base font-bold text-brand-900 sm:text-lg">
                {single.slice(4)}
              </h4>
            );
          }
          if (single.startsWith('## ')) {
            return (
              <h3 key={idx} className="pt-3 font-heading text-lg font-bold text-brand-900 sm:text-xl">
                {single.slice(3)}
              </h3>
            );
          }
          if (single.startsWith('# ')) {
            return (
              <h2 key={idx} className="pt-3 font-heading text-xl font-extrabold text-brand-900 sm:text-2xl">
                {single.slice(2)}
              </h2>
            );
          }
          if (single.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="rounded-r-2xl border-l-4 border-saffron-500 bg-sand-50 px-4 py-3 text-sm font-medium italic text-brand-900 sm:text-base"
              >
                {single.slice(2)}
              </blockquote>
            );
          }
        }

        const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-5 text-slate-700">
              {lines.map((item, i) => (
                <li key={i}>{item.trim().replace(/^[-*•]\s+/, '')}</li>
              ))}
            </ul>
          );
        }

        const isNumberList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isNumberList) {
          return (
            <ol key={idx} className="list-decimal space-y-1.5 pl-5 text-slate-700">
              {lines.map((item, i) => (
                <li key={i}>{item.trim().replace(/^\d+\.\s+/, '')}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {block.trim()}
          </p>
        );
      })}
    </div>
  );
}
