import { Link } from "@tanstack/react-router";
import {
  Sword, Skull, Target, Zap, Trophy, AlertTriangle, ShieldCheck, Flame,
  ArrowRight, Hourglass, Crown, Layers, CheckCircle2,
} from "lucide-react";
import {
  projects, primaryProject, owner, waiting, doNotToday, victories,
  riskLabel, statusLabel,
} from "@/lib/nucleo-data";
import { Shell } from "./Shell";
import { cn } from "@/lib/utils";

export function RPGJourneyView() {
  const xpPct = Math.round((owner.xp / owner.xpNextLevel) * 100);
  const other = projects.filter((p) => !p.isPrimary).slice(0, 4);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Hero - Player + Boss */}
        <div className="relative overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.20 0.05 280), oklch(0.18 0.04 220))" }} />
          <div className="absolute inset-0 bg-grid opacity-[0.10]" aria-hidden />
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-primary)" }} />

          <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            {/* Player */}
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
                <Sword className="h-3.5 w-3.5" /> Jornada Ativa · Cap. 14
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
                Operador <span className="text-gradient-primary">{owner.name}</span>
              </h1>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Sua missão de hoje é congelar o escopo V01 do projeto principal. Foco em uma única coisa.
              </p>

              {/* XP bar */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>NÍVEL {owner.level}</span>
                  <span className="font-mono">{owner.xp} / {owner.xpNextLevel} XP</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="relative h-full rounded-full"
                    style={{ width: `${xpPct}%`, background: "var(--gradient-primary)", boxShadow: "0 0 16px oklch(0.78 0.16 210 / 0.6)" }}
                  >
                    <div className="absolute inset-y-0 -right-1 w-2 rounded-full bg-white/80 blur-sm" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
                <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={`${owner.streak}d`} tone="amber" />
                <Stat icon={<Zap className="h-3.5 w-3.5" />} label="Energia" value={`${owner.energy}%`} tone="cyan" />
                <Stat icon={<Target className="h-3.5 w-3.5" />} label="Foco" value={`${owner.focusToday}%`} tone="violet" />
              </div>
            </div>

            {/* Sword divider */}
            <div className="hidden h-40 w-px bg-gradient-to-b from-transparent via-border-strong to-transparent lg:block" />

            {/* Boss */}
            <BossCard />
          </div>
        </div>

        {/* Mission + Checkpoints */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <MainMissionCard />
          <EnergyAndRiskRadar />
        </div>

        {/* Quests + Side rail */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <SectionTitle icon={<Layers className="h-4 w-4" />} title="Outras Missões em Andamento" />
            <div className="grid gap-3 sm:grid-cols-2">
              {other.map((p) => <QuestCard key={p.id} project={p} />)}
            </div>
          </div>
          <div className="space-y-4">
            <PortalV02 />
            <DoNotTodayCard />
            <RecentLootCard />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "amber" | "cyan" | "violet" }) {
  const c = `var(--${tone})`;
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span style={{ color: c }}>{icon}</span> {label}
      </div>
      <div className="mt-0.5 font-display text-lg font-bold" style={{ color: c }}>{value}</div>
    </div>
  );
}

function BossCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rose)]/40 p-5" style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--rose) 14%, transparent), oklch(0.18 0.04 260))" }}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl" style={{ background: "var(--rose)" }} />
      <div className="relative flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[color:var(--rose)]/40 text-[color:var(--rose)]" style={{ background: "color-mix(in oklab, var(--rose) 20%, transparent)" }}>
          <Skull className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--rose)]">Boss de hoje</div>
          <div className="mt-1 font-display text-xl font-bold leading-tight">Escopo Infinito</div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Risco principal do projeto SEPLAN IA: virar projeto infinito. Derrote separando V01 / V02 / Fora.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>HP do boss</span><span className="font-mono">62%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full bg-[color:var(--rose)]" style={{ width: "62%", boxShadow: "0 0 12px var(--rose)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainMissionCard() {
  const p = primaryProject;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-scan" style={{ background: "linear-gradient(90deg, transparent, oklch(0.78 0.16 210 / 0.8), transparent)" }} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
            <Target className="h-3.5 w-3.5" /> Missão Principal do Dia
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">{p.currentMission}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Projeto:</span> {p.name} ·{" "}
            <span className="font-semibold text-foreground">Próxima ação:</span> {p.nextAction}
          </p>
        </div>
        <div className="hidden shrink-0 md:block">
          <Crown className="h-8 w-8 text-[color:var(--amber)]" />
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Progresso da missão</span>
          <span className="font-mono text-[color:var(--cyan)]">{p.progress}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full" style={{ width: `${p.progress}%`, background: "var(--gradient-primary)", boxShadow: "0 0 16px oklch(0.78 0.16 210 / 0.5)" }} />
        </div>
      </div>

      {/* Checkpoints */}
      <ol className="mt-5 space-y-2">
        {p.checkpoints.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
            <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold",
              c.done ? "bg-[color:var(--emerald)] text-primary-foreground" : "border border-border bg-surface text-muted-foreground")}>
              {c.done ? <CheckCircle2 className="h-4 w-4" /> : String(i + 1).padStart(2, "0")}
            </div>
            <span className={cn("flex-1 text-sm", c.done && "text-muted-foreground line-through")}>{c.label}</span>
            {!c.done && i === 0 && <span className="rounded-md border border-[color:var(--cyan)]/40 bg-[color:color-mix(in_oklab,var(--cyan)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--cyan)]">Agora</span>}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="text-[11px] text-muted-foreground">Critério de conclusão</div>
        <Link to="/projeto/$id" params={{ id: p.id }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold transition hover:border-[color:var(--cyan)]/60 hover:text-[color:var(--cyan)]">
          Abrir projeto <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="mt-2 text-sm">{p.completionCriteria}</p>
    </section>
  );
}

function EnergyAndRiskRadar() {
  const risks = projects.filter((p) => p.risk !== "low").slice(0, 4);
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface/60 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--violet)]">
            <Zap className="h-3.5 w-3.5" /> Energia Mental
          </div>
          <span className="font-mono text-xs text-muted-foreground">tempo real</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-[color:var(--violet)]">{owner.energy}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full" style={{ width: `${owner.energy}%`, background: "linear-gradient(90deg, var(--violet), var(--cyan))", boxShadow: "0 0 12px var(--violet)" }} />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">Bom nível. Mantenha rituais de pausa a cada 90min.</div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--amber)]">
          <AlertTriangle className="h-3.5 w-3.5" /> Radar de Risco
        </div>
        <ul className="space-y-2">
          {risks.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{r.name}</span>
              <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `color-mix(in oklab, var(--${r.risk === "high" ? "rose" : "amber"}) 18%, transparent)`, color: `var(--${r.risk === "high" ? "rose" : "amber"})` }}>
                {riskLabel[r.risk]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
      <span className="text-[color:var(--cyan)]">{icon}</span> {title}
    </div>
  );
}

function QuestCard({ project }: { project: typeof projects[0] }) {
  const c = `var(--${project.color})`;
  return (
    <Link
      to="/projeto/$id"
      params={{ id: project.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 transition hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: c }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Quest · {project.code}</div>
          <div className="mt-0.5 truncate font-display text-base font-bold">{project.name}</div>
          <div className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{project.currentMission}</div>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border font-mono text-xs" style={{ color: c }}>
          {project.progress}%
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full" style={{ width: `${project.progress}%`, background: c, boxShadow: `0 0 8px ${c}` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{statusLabel[project.status]}</span>
        <span>Risco {riskLabel[project.risk]}</span>
      </div>
    </Link>
  );
}

function PortalV02() {
  const v02 = primaryProject.scope.filter((s) => s.bucket === "v02");
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[color:var(--violet)]/40 p-5" style={{ background: "linear-gradient(160deg, color-mix(in oklab, var(--violet) 14%, transparent), transparent)" }}>
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: "var(--violet)" }} />
      <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--violet)]">
        <Layers className="h-3.5 w-3.5" /> Portal V02
      </div>
      <p className="relative mt-1 text-[12px] text-muted-foreground">Tudo o que NÃO entra no V01 atravessa este portal.</p>
      <ul className="relative mt-3 space-y-1.5">
        {v02.slice(0, 5).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface/60 px-2.5 py-1.5 text-sm">
            <span className="truncate">{s.text}</span>
            <span className="shrink-0 rounded-md border border-[color:var(--violet)]/40 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--violet)]">V02</span>
          </li>
        ))}
      </ul>
      <Link to="/v02" className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--violet)] hover:underline">
        Abrir portal completo <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

function DoNotTodayCard() {
  return (
    <section className="rounded-2xl border border-[color:var(--rose)]/30 p-5" style={{ background: "color-mix(in oklab, var(--rose) 8%, transparent)" }}>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--rose)]">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-current">⊘</span> Não fazer hoje
      </div>
      <ul className="space-y-1.5 text-sm">
        {doNotToday.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--rose)]" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentLootCard() {
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--emerald)]">
        <Trophy className="h-3.5 w-3.5" /> Loot Recente
      </div>
      <ul className="space-y-2 text-sm">
        {victories.slice(0, 4).map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[color:var(--emerald)]" />
              <span className="truncate">{v.text}</span>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{v.when}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
