import { Link } from "@tanstack/react-router";
import {
  AlertTriangle, Hourglass, CheckCircle2, Crown, ArrowRight,
  ShieldAlert, Compass, MapPin,
  Radar, Flag, Target, Ban, Layers,
} from "lucide-react";
import {
  projects, primaryProject, waiting, victories, doNotToday, riskLabel, statusLabel,
  type Project,
} from "@/lib/nucleo-data";
import { Shell } from "./Shell";

const riskTone: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "color-mix(in oklab, var(--rose) 16%, transparent)", text: "var(--rose)", label: "Alto" },
  med: { bg: "color-mix(in oklab, var(--amber) 16%, transparent)", text: "var(--amber)", label: "Médio" },
  low: { bg: "color-mix(in oklab, var(--emerald) 16%, transparent)", text: "var(--emerald)", label: "Baixo" },
};

export function StrategicMapView() {
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <TopBar />
        <Cockpit />
        <SecondaryGrid />
      </div>
    </Shell>
  );
}

/* ---------------- Top Bar ---------------- */

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
          <Compass className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-bold tracking-[0.18em]">
            ATLAS <span className="text-muted-foreground">— Núcleo de Projetos</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
            Mapa Estratégico de Escopo
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--emerald)] shadow-[0_0_8px_var(--emerald)]" />
          <span className="font-mono">SESSÃO ATIVA</span>
        </span>
        <span className="hidden rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-muted-foreground sm:inline">
          T-2h 35m até checkpoint
        </span>
      </div>
    </header>
  );
}

/* ---------------- Cockpit (first fold) ---------------- */

function Cockpit() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <SeplanCommandCard />
      <div className="grid gap-4">
        <AntiDeviationCard />
        <DoNotTodayCard />
      </div>
    </section>
  );
}

function SeplanCommandCard() {
  const c = "var(--cyan)";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-[oklch(0.13_0.03_260)] p-5 shadow-[var(--shadow-elevated)]"
      style={{ borderColor: "color-mix(in oklab, var(--cyan) 30%, var(--border))" }}
    >
      <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: c }} aria-hidden />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: "var(--violet)" }} aria-hidden />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">PROJETO PRINCIPAL · 01</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
          <Radar className="h-3.5 w-3.5" /> Rota Principal de Hoje
        </div>
      </div>

      <div className="relative mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold leading-none tracking-tight md:text-4xl" style={{ color: c, textShadow: `0 0 28px color-mix(in oklab, ${c} 50%, transparent)` }}>
            SEPLAN IA
          </h1>
          <Crown className="h-5 w-5 text-[color:var(--amber)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold" style={{ color: c }}>{primaryProject.progress}%</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">do MVP V01</span>
        </div>
      </div>

      <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${primaryProject.progress}%`, background: `linear-gradient(90deg, ${c}, var(--violet))`, boxShadow: `0 0 14px ${c}` }} />
      </div>

      {/* Route */}
      <div className="relative mt-5 grid gap-2 md:grid-cols-4">
        <RouteNode
          tone="cyan" icon={<MapPin className="h-3.5 w-3.5" />}
          label="Estado Atual"
          text="Escopo espalhado entre atendimento público, análise técnica e pipeline documental."
        />
        <RouteNode
          tone="violet" icon={<ArrowRight className="h-3.5 w-3.5" />}
          label="Próxima Ação"
          text="Separar V01, V02 e Fora do Escopo."
        />
        <RouteNode
          tone="amber" icon={<Target className="h-3.5 w-3.5" />}
          label="Checkpoint"
          text="Validar fronteiras e dependências."
        />
        <RouteNode
          tone="emerald" icon={<Flag className="h-3.5 w-3.5" />}
          label="Destino V01"
          text="MVP de triagem e orientação preliminar da SEPLAN, sem substituir análise técnica."
          final
        />
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><Hourglass className="h-3.5 w-3.5" /> Tempo restante hoje <span className="font-mono text-foreground">2h 35m</span></span>
        <Link
          to="/projeto/$id" params={{ id: primaryProject.id }}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--cyan)]/40 bg-[color:color-mix(in_oklab,var(--cyan)_10%,transparent)] px-2.5 py-1 font-semibold text-[color:var(--cyan)] hover:bg-[color:color-mix(in_oklab,var(--cyan)_18%,transparent)]"
        >
          Abrir comando do projeto <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function RouteNode({
  label, text, tone, icon, final,
}: { label: string; text: string; tone: "cyan" | "violet" | "amber" | "emerald"; icon: React.ReactNode; final?: boolean }) {
  const c = `var(--${tone})`;
  return (
    <div
      className="relative rounded-xl border border-border bg-surface/70 p-3 backdrop-blur"
      style={{ boxShadow: final ? `inset 0 0 0 1px color-mix(in oklab, ${c} 35%, transparent), 0 0 28px -10px ${c}` : undefined }}
    >
      <div className="flex items-center gap-1.5" style={{ color: c }}>
        <span className="grid h-5 w-5 place-items-center rounded-md border border-current/40" style={{ background: `color-mix(in oklab, ${c} 14%, transparent)` }}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-foreground/90">{text}</p>
    </div>
  );
}

function AntiDeviationCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--amber)]/40 bg-[color:color-mix(in_oklab,var(--amber)_8%,transparent)] p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: "var(--amber)" }} aria-hidden />
      <div className="relative flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:var(--amber)]/50 text-[color:var(--amber)]" style={{ background: "color-mix(in oklab, var(--amber) 16%, transparent)" }}>
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--amber)]">Alerta Anti-Desvio</div>
          <p className="mt-1 text-sm font-semibold leading-snug">
            Não expandir para automação completa antes de fechar o MVP.
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Mantenha o foco em triagem e orientação preliminar. Tudo além disso vai para o Portal V02.
          </p>
        </div>
      </div>
    </div>
  );
}

function DoNotTodayCard() {
  return (
    <div className="rounded-2xl border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] p-4">
      <div className="mb-2 flex items-center gap-2 text-[color:var(--rose)]">
        <Ban className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">O que NÃO fazer hoje</span>
      </div>
      <ul className="grid gap-1.5">
        {doNotToday.map((d, i) => {
          const [head, ...rest] = d.split(" — ");
          return (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--rose)] shadow-[0_0_6px_var(--rose)]" />
              <span><span className="font-semibold">{head}</span>{rest.length > 0 && <span className="text-muted-foreground"> — {rest.join(" — ")}</span>}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Below the fold ---------------- */

function SecondaryGrid() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <TerritoriesMap />
      <div className="grid gap-4">
        <V02Panel />
        <RiskZones />
        <WaitingPanel />
        <VictoriesPanel />
      </div>
    </section>
  );
}

function TerritoriesMap() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-[oklch(0.13_0.03_260)] p-4 shadow-[var(--shadow-elevated)]">
      <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
      <div className="relative mb-3 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          ◷ Territórios Estratégicos
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend dot="var(--emerald)" label="Saudável" />
          <Legend dot="var(--amber)" label="Atenção" />
          <Legend dot="var(--rose)" label="Crítico" />
        </div>
      </div>
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      to="/projeto/$id" params={{ id: project.id }}
      className="group relative block overflow-hidden rounded-xl border border-border bg-surface/60 p-3 transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
      style={{ boxShadow: project.isPrimary ? `0 0 0 1px ${c}, 0 0 30px -10px ${c}` : undefined }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-3xl" style={{ background: c }} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{project.code}</span>
          <span className="truncate font-display text-sm font-bold">{project.name}</span>
          {project.isPrimary && <Crown className="h-3.5 w-3.5 shrink-0 text-[color:var(--amber)]" />}
        </div>
        <span className="font-display text-base font-bold" style={{ color: c }}>{project.progress}%</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: c, boxShadow: `0 0 10px ${c}` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground">{statusLabel[project.status]}</span>
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold" style={{ background: tone.bg, color: tone.text }}>
          <ShieldAlert className="h-2.5 w-2.5" /> {riskLabel[project.risk]}
        </span>
      </div>
    </Link>
  );
}

function RiskZones() {
  const risks = projects.filter((p) => p.risk !== "low").slice(0, 3);
  return (
    <Panel icon={<AlertTriangle className="h-4 w-4" />} title="Zonas de Risco" count={risks.length} accent="rose">
      <ul className="divide-y divide-border">
        {risks.map((r) => {
          const tone = riskTone[r.risk];
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.text, boxShadow: `0 0 8px ${tone.text}` }} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">{r.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{r.alerts[0] ?? "—"}</div>
                </div>
              </div>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: tone.bg, color: tone.text }}>{tone.label}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function WaitingPanel() {
  return (
    <Panel icon={<Hourglass className="h-4 w-4" />} title="Aguardando Resposta" count={waiting.length} accent="cyan">
      <ul className="divide-y divide-border">
        {waiting.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{w.source}</div>
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
  const v02 = primaryProject.scope.filter((s) => s.bucket === "v02");
  const fora = primaryProject.scope.filter((s) => s.bucket === "fora");
  return (
    <Panel icon={<Layers className="h-4 w-4" />} title="Portal V02 / Fora do Escopo" count={v02.length + fora.length} accent="violet">
      <ul className="divide-y divide-border">
        {v02.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-1.5">
            <span className="truncate text-[13px]">{s.text}</span>
            <span className="shrink-0 rounded border border-[color:var(--violet)]/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[color:var(--violet)]">V02</span>
          </li>
        ))}
        {fora.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-1.5">
            <span className="truncate text-[13px]">{s.text}</span>
            <span className="shrink-0 rounded border border-[color:var(--rose)]/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[color:var(--rose)]">FORA</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function VictoriesPanel() {
  return (
    <Panel icon={<CheckCircle2 className="h-4 w-4" />} title="Vitórias Recentes" count={victories.length} accent="emerald">
      <ul className="divide-y divide-border">
        {victories.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--emerald)]" />
              <span className="truncate text-[13px]">{v.text}</span>
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
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2" style={{ color: c }}>
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{title}</span>
        </div>
        {typeof count === "number" && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold" style={{ background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }}>{count}</span>
        )}
      </header>
      <div className="px-4">{children}</div>
    </section>
  );
}

// Unused helpers kept to preserve module shape
export { Shell };
function _unused() { return [Users, FileText, Building2, Settings2]; }
