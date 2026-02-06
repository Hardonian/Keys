import type { RunbookAnnotation } from './types';

interface CellAnnotationsProps {
  annotations: RunbookAnnotation[];
}

const kindStyles: Record<RunbookAnnotation['kind'], string> = {
  note: 'border-slate-200 bg-slate-50 text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  decision: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  evidence: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

export function CellAnnotations({ annotations }: CellAnnotationsProps) {
  if (annotations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        No inline annotations yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {annotations.map(annotation => (
        <article
          key={annotation.id}
          className={`rounded-xl border p-4 ${kindStyles[annotation.kind]}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide">
              {annotation.kind} • {annotation.cellId}
            </div>
            {annotation.status && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                {annotation.status.replace('-', ' ')}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm">{annotation.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>By {annotation.author}</span>
            {annotation.tags?.map(tag => (
              <span key={tag} className="rounded-full bg-white/70 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
