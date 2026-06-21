import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import { projects, riskLabel, statusLabel, type Project } from "@/lib/nucleo-data";
import {
  ArrowLeft, Target, ArrowRight, AlertTriangle, CheckCircle2,
  Flag, MapPin, Hourglass, ShieldCheck, Layers, Ban, Plus,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/projeto/$id")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.id === params.id);
    if (!project) throw notFound();
    return { project };
  },
  notFoundComponent: () => (
    <Shell>
      <div className="rounded-2xl border border-border bg-surface/60 p-10 text-center">
        <h1 className="font-display text-2xl font-bold">Projeto não encontrado</h1>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Voltar ao mapa
        </Link>
      </div>
    </Shell>
  ),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project: loadedProject } = Route.useLoaderData() as { project: Project };
  const { state, actions } = useNucleoState();
  const [evidenceText, setEvidenceText] = useState("");
  const p = state.projects.find((project) => project.id === loadedProject.id) ?? loadedProject;
  const c = `var(--${p.color})`;
  const v01 = p.scope.filter((s) => s.bucket === "v01");
  const v02 = p.scope.filter((s) => s.bucket === "v02");
  const fora = p.scope.filter((s) => s.bucket === "fora");

  function addEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.addProjectEvidence(p.id, evidenceText);
    setEvidenceText("");
  }

  return (
    <Shell>
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Mapa Estratégico
        </Link>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-border p-6 md:p-8" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${c} 14%, transparent), oklch(0.18 0.04 260))` }}>
          <div className="absolute inset-0 bg-grid opacity-[0.07]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: c }} />
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div className="font-mono text-xs text-muted-foreground">Projeto · {p.code}</div>
              <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-border bg-surface/60 px-2 py-1">{statusLabel[p.status]}</span>
                <span className="rounded-md px-2 py-1 font-semibold" style={{ background: `color-mix(in oklab, ${c} 16%, transparent)`, color: c }}>
                  Risco {riskLabel[p.risk]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl font-bold" style={{ color: c }}>{p.progress}%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">progresso real</div>
            </div>
          </div>
        </header>

        {/* State -> Destination */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={<MapPin className="h-4 w-4" />} title="Estado atual" tone="cyan">{p.currentState}</InfoCard>
          <InfoCard icon={<Flag className="h-4 w-4" />} title="Destino V01" tone="violet">{p.destination}</InfoCard>
        </div>

        {/* Mission */}
        <section className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <MissionStep icon={<Target className="h-4 w-4" />} label="Missão atual" text={p.currentMission} />
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <MissionStep icon={<ArrowRight className="h-4 w-4" />} label="Próxima ação" text={p.nextAction} />
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <MissionStep icon={<CheckCircle2 className="h-4 w-4" />} label="Critério de conclusão" text={p.completionCriteria} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[color:var(--cyan)]">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="font-display text-lg font-bold">Checkpoints do projeto</h2>
            </div>
            <span className="rounded-lg border border-border bg-background/25 px-3 py-1 font-mono text-xs text-muted-foreground">
              {p.checkpoints.filter((checkpoint) => checkpoint.done).length}/{p.checkpoints.length}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {p.checkpoints.map((checkpoint) => (
              <button
                key={checkpoint.id}
                type="button"
                onClick={() => actions.toggleProjectCheckpoint(p.id, checkpoint.id)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/25 px-3 py-3 text-left text-sm transition hover:border-[color:var(--cyan)]/40 hover:bg-background/40"
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${checkpoint.done ? "border-[color:var(--emerald)]/40 text-[color:var(--emerald)]" : "border-border text-muted-foreground"}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className={checkpoint.done ? "font-semibold text-foreground" : "text-muted-foreground"}>{checkpoint.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Scope buckets */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ScopeBucket title="Escopo V01" tone="cyan" icon={<Target className="h-4 w-4" />} items={v01.map(s => s.text)} />
          <ScopeBucket title="V02 — Portal" tone="violet" icon={<Layers className="h-4 w-4" />} items={v02.map(s => s.text)} />
          <ScopeBucket title="Fora do Escopo" tone="rose" icon={<Ban className="h-4 w-4" />} items={fora.map(s => s.text)} />
        </div>

        {/* Dependencies + evidence + alerts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <PanelList title="Dependências" icon={<Hourglass className="h-4 w-4" />} tone="amber"
            empty="Sem dependências externas."
            items={p.dependencies.map((d) => ({ key: d.id, primary: d.who, secondary: d.what, tail: `${d.waitingDays}d` }))} />
          <EvidencePanel
            evidence={p.evidence.map((e) => ({ key: e.id, primary: e.label, tail: e.when }))}
            value={evidenceText}
            onChange={setEvidenceText}
            onSubmit={addEvidence}
          />
          <PanelList title="Alertas de desvio" icon={<AlertTriangle className="h-4 w-4" />} tone="rose"
            empty="Tudo sob controle."
            items={p.alerts.map((a, i) => ({ key: String(i), primary: a }))} />
        </div>
      </div>
    </Shell>
  );
}

function InfoCard({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: "cyan" | "violet"; children: React.ReactNode }) {
  const c = `var(--${tone})`;
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c }}>
        {icon}{title}
      </div>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function MissionStep({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-[color:var(--cyan)]">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold leading-snug">{text}</div>
      </div>
    </div>
  );
}

function ScopeBucket({ title, tone, icon, items }: { title: string; tone: "cyan" | "violet" | "rose"; icon: React.ReactNode; items: string[] }) {
  const c = `var(--${tone})`;
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
          {icon}{title}
        </div>
        <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
      </header>
      <ul className="divide-y divide-border">
        {items.length === 0 && <li className="px-4 py-4 text-sm text-muted-foreground">Vazio.</li>}
        {items.map((t, i) => (
          <li key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
            <span className="min-w-0">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidencePanel({
  evidence,
  value,
  onChange,
  onSubmit,
}: {
  evidence: { key: string; primary: string; tail?: string }[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const c = "var(--emerald)";

  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        <ShieldCheck className="h-4 w-4" />Evidências
      </header>
      <form onSubmit={onSubmit} className="border-b border-border p-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Registrar evidência
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Ex.: escopo V01 revisado"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background/25 px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--emerald)]"
            />
            <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color:var(--emerald)]/35 bg-[color:color-mix(in_oklab,var(--emerald)_12%,transparent)] text-[color:var(--emerald)]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </label>
      </form>
      <ul className="divide-y divide-border px-4">
        {evidence.length === 0 && <li className="py-4 text-sm text-muted-foreground">Sem evidências registradas.</li>}
        {evidence.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.primary}</div>
            </div>
            {item.tail && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.tail}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PanelList({
  title, icon, tone, items, empty,
}: { title: string; icon: React.ReactNode; tone: "amber" | "emerald" | "rose"; items: { key: string; primary: string; secondary?: string; tail?: string }[]; empty: string }) {
  const c = `var(--${tone})`;
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        {icon}{title}
      </header>
      <ul className="divide-y divide-border px-4">
        {items.length === 0 && <li className="py-4 text-sm text-muted-foreground">{empty}</li>}
        {items.map((it) => (
          <li key={it.key} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{it.primary}</div>
              {it.secondary && <div className="truncate text-[11px] text-muted-foreground">{it.secondary}</div>}
            </div>
            {it.tail && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{it.tail}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
