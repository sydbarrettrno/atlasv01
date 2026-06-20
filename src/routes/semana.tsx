import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { projects, victories, waiting, doNotToday } from "@/lib/nucleo-data";
import { CalendarRange, TrendingUp, CheckCircle2, Hourglass, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/semana")({
  head: () => ({ meta: [{ title: "Revisão Semanal · Núcleo" }] }),
  component: Weekly,
});

function Weekly() {
  return (
    <Shell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
              <CalendarRange className="h-3.5 w-3.5" /> Revisão Semanal
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold">O que avançou. O que travou.</h1>
          </div>
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-2 font-mono text-sm">Semana 25 · 2026</div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {projects.slice(0, 3).map((p) => {
            const c = `var(--${p.color})`;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-surface/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.name}</div>
                  <TrendingUp className="h-4 w-4" style={{ color: c }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold" style={{ color: c }}>+{Math.round(p.progress / 6)}%</span>
                  <span className="text-xs text-muted-foreground">esta semana</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full" style={{ width: `${p.progress}%`, background: c }} />
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <List title="Vitórias" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" items={victories.map(v => v.text)} />
          <List title="Travadas / Aguardando" icon={<Hourglass className="h-4 w-4" />} tone="amber" items={waiting.map(w => `${w.source} — ${w.topic}`)} />
          <List title="Aprender com" icon={<AlertTriangle className="h-4 w-4" />} tone="rose" items={doNotToday} />
        </div>
      </div>
    </Shell>
  );
}

function List({ title, icon, tone, items }: { title: string; icon: React.ReactNode; tone: "emerald" | "amber" | "rose"; items: string[] }) {
  const c = `var(--${tone})`;
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        {icon}{title}
      </header>
      <ul className="divide-y divide-border px-4">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 py-2.5 text-sm">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: c }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
