import type { Block, Cell } from "@/lib/finance/jaci";
import { brl, usd } from "@/lib/finance/format";
import type { ReactNode } from "react";

export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold text-foreground">{p}</strong> : p))}</>;
}
function CellView({ c, showBrl }: { c: Cell; showBrl: boolean }): ReactNode {
  if (typeof c === "string") return c === "Não informado" ? <span className="text-muted-foreground italic">{c}</span> : c;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {c.prefix && <span className="text-muted-foreground">{c.prefix}</span>}
      {usd(c.usd)}
      {showBrl && <span className="block text-xs text-muted-foreground">≈ {brl(c.usd)}</span>}
    </span>
  );
}

export function BlockView({ b, showBrl, onSuggest }: { b: Block; showBrl: boolean; onSuggest: (s: string) => void }) {
  switch (b.type) {
    case "text":
      return <p className="leading-relaxed text-foreground/90"><Rich text={b.text} /></p>;
    case "stats":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          {b.items.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-lg font-semibold text-primary"><CellView c={s.value} showBrl={showBrl} /></div>
              {s.hint && <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>}
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{b.headers.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((c, j) => <td key={j} className="px-3 py-2 align-top"><CellView c={c} showBrl={showBrl} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "bars": {
      const max = Math.max(...b.items.map((i) => i.value));
      return (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          {b.items.map((i) => (
            <div key={i.label}>
              <div className="flex justify-between gap-2 text-sm">
                <span>{i.label} <span className="text-muted-foreground">· {i.count}</span></span>
                <span className="font-medium tabular-nums">{usd(i.value)}{showBrl && <span className="text-muted-foreground"> ≈ {brl(i.value)}</span>}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      );
    }
    case "suggestions":
      return <Suggestions items={b.items} onSuggest={onSuggest} />;
  }
}
export function Suggestions({ items, onSuggest }: { items: string[]; onSuggest: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <button key={s} type="button" onClick={() => onSuggest(s)} className="rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition hover:border-primary/50 hover:bg-accent">
          {s}
        </button>
      ))}
    </div>
  );
}
