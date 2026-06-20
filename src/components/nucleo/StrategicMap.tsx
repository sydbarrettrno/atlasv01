import { Link } from "@tanstack/react-router";
import {
  AlertTriangle, Hourglass, CheckCircle2, Crown, ArrowRight,
  ShieldAlert, Compass, MapPin, Users, FileText, Building2, Settings2,
} from "lucide-react";
import {
  projects, primaryProject, waiting, victories, doNotToday, riskLabel, statusLabel,
  type Project,
} from "@/lib/nucleo-data";
import { Shell, TopMetricsBar } from "./Shell";
import { cn } from "@/lib/utils";

const riskTone: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "color-mix(in oklab, var(--rose) 16%, transparent)", text: "var(--rose)", label: "Alto" },
  med: { bg: "color-mix(in oklab, var(--amber) 16%, transparent)", text: "var(--amber)", label: "Médio" },
  low: { bg: "color-mix(in oklab, var(--emerald) 16%, transparent)", text: "var(--emerald)", label: "Baixo" },
};

export function StrategicMapView() {
  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6 text-[color:var(--cyan)]" />
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Mapa Estratégico de Escopo
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão geral para decidir com clareza e agir com foco.
            </p>
          </div>
          <TopMetricsBar />
        </div>

        {/* Rota principal */}
        <RouteBar />

        {/* Map + right rail */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <TerritoriesMap />
          <div className="space-y-4">
            <RiskZones />
            <WaitingPanel />
            <V02Panel />
            <VictoriesPanel />
          </div>
        </div>

        <DoNotTodayBar />
      </div>
    </Shell>
  );
}

function RouteBar() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur">
      <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="lg:w-64">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--cyan)]">
            Rota principal de hoje
          </div>
          <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Projeto</div>
          <div className="mt-1 flex items-center gap-2 font-display text-xl font-bold">
            {primaryProject.name}
            <Crown className="h-4 w-4 text-[color:var(--amber)]" />
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-3">
          <RouteStep label="Estado Atual" text="Congelar escopo V01" tone="cyan" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <RouteStep label="Próxima Ação" text="Separar V01, V02 e Fora do Escopo" tone="violet" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <RouteStep label="Checkpoint" text="Validar fronteiras e dependências" tone="amber" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--emerald)]/40" style={{ background: "color-mix(in oklab, var(--emerald) 16%, transparent)" }}>
            <CheckCircle2 className="h-5 w-5 text-[color:var(--emerald)]" />
          </div>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Tempo estimado restante hoje</span>
        <span className="flex items-center gap-1.5 font-mono"><Hourglass className="h-3.5 w-3.5" /> 2h 35m</span>
      </div>
    </div>
  );
}

function RouteStep({ label, text, tone }: { label: string; text: string; tone: "cyan" | "violet" | "amber" }) {
  const c = `var(--${tone})`;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border" style={{ background: `color-mix(in oklab, ${c} 12%, transparent)`, color: c }}>
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold">{text}</div>
      </div>
    </div>
  );
}

function TerritoriesMap() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-[oklch(0.13_0.03_260)] p-4 shadow-[var(--shadow-elevated)] md:p-6">
      <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.78 0.16 210 / 0.12), transparent 60%)" }} />

      <div className="relative mb-4 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          ◷ Territórios Estratégicos
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend dot="var(--emerald)" label="Saudável" />
          <Legend dot="var(--amber)" label="Atenção" />
          <Legend dot="var(--rose)" label="Crítico" />
          <Legend dot="var(--sky)" label="Planejamento" />
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => <TerritoryCard key={p.id} project={p} />)}
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
      {label}
    </span>
  );
}

function TerritoryCard({ project }: { project: Project }) {
  const c = `var(--${project.color})`;
  const tone = riskTone[project.risk];
  return (
    <Link
      to="/projeto/$id"
      params={{ id: project.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
      style={{ boxShadow: project.isPrimary ? `0 0 0 1px ${c}, 0 0 40px -8px ${c}` : undefined }}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50" style={{ background: c }} />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
          <span className="font-display text-lg font-bold leading-tight">{project.name}</span>
          {project.isPrimary && <Crown className="h-4 w-4 text-[color:var(--amber)]" />}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold" style={{ color: c }}>{project.progress}%</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">progresso</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: c, boxShadow: `0 0 12px ${c}` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium">{statusLabel[project.status]}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Risco</div>
          <div className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold" style={{ background: tone.bg, color: tone.text }}>
            <ShieldAlert className="h-3 w-3" /> {riskLabel[project.risk]}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-muted-foreground">
        <IconChip><Users className="h-3 w-3" /></IconChip>
        <IconChip><FileText className="h-3 w-3" /></IconChip>
        <IconChip><Building2 className="h-3 w-3" /></IconChip>
        <IconChip><Settings2 className="h-3 w-3" /></IconChip>
      </div>
    </Link>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return <span className="grid h-6 w-6 place-items-center rounded-md border border-border bg-surface-2/60">{children}</span>;
}

function RiskZones() {
  const risks = projects.filter((p) => p.risk !== "low").slice(0, 3);
  return (
    <Panel
      icon={<AlertTriangle className="h-4 w-4" />}
      title="Zonas de Risco"
      count={risks.length}
      accent="rose"
    >
      <ul className="divide-y divide-border">
        {risks.map((r) => {
          const tone = riskTone[r.risk];
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.text, boxShadow: `0 0 8px ${tone.text}` }} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{r.alerts[0] ?? "—"}</div>
                </div>
              </div>
              <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: tone.bg, color: tone.text }}>
                Risco {tone.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function WaitingPanel() {
  return (
    <Panel
      icon={<Hourglass className="h-4 w-4" />}
      title="Aguardando Resposta"
      count={waiting.length}
      accent="cyan"
    >
      <ul className="divide-y divide-border">
        {waiting.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{w.source}</div>
              <div className="truncate text-[11px] text-muted-foreground">{w.topic}</div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{w.days}d</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function V02Panel() {
  const v02 = projects[0].scope.filter((s) => s.bucket === "v02");
  return (
    <Panel
      icon={<ArrowRight className="h-4 w-4" />}
      title="Fora do Escopo / V02"
      count={v02.length}
      accent="violet"
    >
      <ul className="divide-y divide-border">
        {v02.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2">
            <span className="truncate text-sm">{s.text}</span>
            <span className="shrink-0 rounded-md border border-[color:var(--violet)]/30 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[color:var(--violet)]">V02</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function VictoriesPanel() {
  return (
    <Panel
      icon={<CheckCircle2 className="h-4 w-4" />}
      title="Vitórias Recentes"
      count={victories.length}
      accent="emerald"
    >
      <ul className="divide-y divide-border">
        {victories.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--emerald)]" />
              <span className="truncate text-sm">{v.text}</span>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{v.when}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Panel({
  icon, title, count, accent, children,
}: { icon: React.ReactNode; title: string; count?: number; accent: "rose" | "cyan" | "violet" | "emerald"; children: React.ReactNode }) {
  const c = `var(--${accent})`;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2" style={{ color: c }}>
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{title}</span>
        </div>
        {typeof count === "number" && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold" style={{ background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }}>
            {count}
          </span>
        )}
      </header>
      <div className="px-4">{children}</div>
    </section>
  );
}

function DoNotTodayBar() {
  return (
    <div className="rounded-2xl border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] p-4">
      <div className="mb-3 flex items-center gap-2 text-[color:var(--rose)]">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-current">⊘</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]">O que NÃO fazer hoje</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {doNotToday.map((d, i) => {
          const [head, ...rest] = d.split(" — ");
          return (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[color:var(--rose)]/40 text-[10px] text-[color:var(--rose)]">⊘</span>
              <div className="min-w-0">
                <div className="font-semibold">{head}</div>
                {rest.length > 0 && <div className="text-[12px] text-muted-foreground">{rest.join(" — ")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Shell };
