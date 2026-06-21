import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BatteryCharging,
  Bell,
  CheckCircle2,
  Compass,
  Crown,
  Flag,
  Flame,
  Hourglass,
  Layers,
  Lock,
  MapPin,
  Radar,
  Settings,
  ShieldAlert,
  Sparkles,
  Sword,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { useNucleoState } from "@/hooks/useNucleoState";
import {
  type MissionJourneyStep,
  type Project,
  type ProjectStatus,
  type RiskLevel,
  type ScopeTerritory,
} from "@/lib/nucleo-data";
import { Shell } from "./Shell";
import { useState, type FormEvent, type ReactNode } from "react";

const toneColor: Record<ScopeTerritory["tone"], string> = {
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  amber: "var(--amber)",
  emerald: "var(--emerald)",
  rose: "var(--rose)",
};

const statusTone: Record<ScopeTerritory["status"], string> = {
  "No Trilho": "var(--cyan)",
  "Em Progresso": "var(--violet)",
  Atenção: "var(--amber)",
  Bloqueado: "var(--rose)",
  Concluído: "var(--emerald)",
};

type NewProjectDraft = {
  name: string;
  currentMission: string;
  nextAction: string;
  risk: RiskLevel;
  status: ProjectStatus;
  color: Project["color"];
};

const initialNewProjectDraft: NewProjectDraft = {
  name: "",
  currentMission: "",
  nextAction: "",
  risk: "med",
  status: "planejamento",
  color: "cyan",
};

export function StrategicMapView() {
  return (
    <Shell>
      <div className="flex flex-col gap-5 pb-8">
        <GamifiedTopbar />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <MissionHero />
            <MissionJourney />
            <ScopeCampaignMap />
          </div>
          <CommandColumn />
        </section>

        <OperationalRow />
      </div>
    </Shell>
  );
}

function GamifiedTopbar() {
  const { state } = useNucleoState();
  const { dashboardStats } = state;

  return (
    <header className="atlas-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl atlas-glow-blue" style={{ background: "var(--gradient-primary)" }}>
          <Compass className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display text-lg font-bold tracking-[0.18em]">ATLASV01</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
            Centro de Comando TDAH-aware
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        <StatPill icon={<Flame className="h-4 w-4" />} label="Sequência" value={`${dashboardStats.focusStreak} dias`} tone="amber" />
        <StatPill icon={<Zap className="h-4 w-4" />} label="XP Total" value={`${dashboardStats.xpCurrent.toLocaleString("pt-BR")} / ${dashboardStats.xpTotal.toLocaleString("pt-BR")}`} tone="cyan" />
        <StatPill icon={<Crown className="h-4 w-4" />} label="Nível" value={`${dashboardStats.level}`} tone="violet" />
        <StatPill icon={<Trophy className="h-4 w-4" />} label="Checkpoints" value={`${dashboardStats.checkpointsDone} / ${dashboardStats.checkpointsTotal}`} tone="emerald" />
        <StatPill icon={<Layers className="h-4 w-4" />} label="Portal V02" value={`${dashboardStats.portalV02}%`} tone="violet" />
        <div className="ml-1 flex items-center gap-1">
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface/70 text-muted-foreground transition hover:text-foreground" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface/70 text-muted-foreground transition hover:text-foreground" aria-label="Configurações">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "violet" | "amber" | "emerald";
}) {
  const color = `var(--${tone})`;
  return (
    <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg border border-current/30" style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}>
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="font-mono text-[12px] font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function MissionHero() {
  const navigate = useNavigate();
  const { state, actions } = useNucleoState();
  const { todayMission } = state;
  const primaryProject = state.projects.find((project) => project.isPrimary) ?? state.projects[0];

  function startMissionFocus() {
    actions.startFocusSession();
    void navigate({ to: "/foco" });
  }

  return (
    <section className="atlas-hero p-5 lg:p-6">
      <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cyan)]/35 bg-[color:color-mix(in_oklab,var(--cyan)_12%,transparent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--cyan)]">
              <Crown className="h-3.5 w-3.5" />
              {todayMission.sectionTitle}
            </span>
            <span className="rounded-full border border-[color:var(--amber)]/35 bg-[color:color-mix(in_oklab,var(--amber)_12%,transparent)] px-3 py-1 text-[11px] font-semibold text-[color:var(--amber)]">
              Entrega prevista: {todayMission.deliveryDate}
            </span>
          </div>

          <h1 className="max-w-4xl font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
            {todayMission.mission}
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background/30 px-3 py-2 text-sm font-semibold text-muted-foreground">
            <Flag className="h-4 w-4 text-[color:var(--amber)]" />
            {todayMission.projectTag}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="rounded-2xl border border-[color:var(--cyan)]/30 bg-background/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-[color:var(--cyan)]">
                <Target className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Próxima Ação Exata</span>
              </div>
              <p className="text-lg font-semibold leading-snug text-foreground">{todayMission.nextAction}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startMissionFocus}
                  className="atlas-cta inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.16em]"
                >
                  {todayMission.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4 text-[color:var(--amber)]" />
                  {todayMission.suggestedTime}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-4 text-center">
              <ProgressRing value={todayMission.progress} />
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Progresso real</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--emerald)]/30 bg-[color:color-mix(in_oklab,var(--emerald)_8%,transparent)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[color:var(--emerald)]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Critério de conclusão</span>
          </div>
          <ul className="grid gap-2">
            {todayMission.completionChecklist.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => actions.toggleMissionChecklistItem(item.id)}
                  className="flex w-full items-start gap-2 rounded-xl border border-border bg-background/25 px-3 py-2 text-left text-sm leading-snug transition hover:border-[color:var(--emerald)]/40 hover:bg-background/40"
                >
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.done ? "text-[color:var(--emerald)]" : "text-muted-foreground"}`} />
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
          {primaryProject && (
            <Link
              to="/projeto/$id"
              params={{ id: primaryProject.id }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--emerald)]/35 bg-background/30 px-3 py-2.5 text-sm font-semibold text-[color:var(--emerald)] transition hover:bg-[color:color-mix(in_oklab,var(--emerald)_12%,transparent)]"
            >
              Abrir detalhe do projeto
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="url(#missionProgress)"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="missionProgress" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.16 210)" />
            <stop offset="60%" stopColor="oklch(0.72 0.20 295)" />
            <stop offset="100%" stopColor="oklch(0.82 0.16 75)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold text-[color:var(--cyan)]">{value}%</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">V01</div>
      </div>
    </div>
  );
}

function MissionJourney() {
  const { state, actions } = useNucleoState();
  const { missionJourney } = state;
  const currentStep = missionJourney.find((step) => step.state === "active")?.label ?? "Campanha concluida";

  return (
    <section className="atlas-panel p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sword className="h-5 w-5 text-[color:var(--amber)]" />
          <div>
            <h2 className="font-display text-xl font-bold">Jornada da Missão</h2>
            <p className="text-sm text-muted-foreground">Caminho de campanha para fechar a entrega V01.</p>
          </div>
        </div>
        <span className="rounded-full border border-[color:var(--cyan)]/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--cyan)]">
          Etapa atual: {currentStep}
        </span>
      </div>

      <div className="relative grid gap-3 md:grid-cols-6">
        {missionJourney.map((step, index) => (
          <JourneyStep
            key={step.id}
            step={step}
            index={index + 1}
            hasConnector={index < missionJourney.length - 1}
            canInteract={step.state === "active" || (step.state === "blocked" && missionJourney[index - 1]?.state === "done")}
            onToggle={() => actions.toggleJourneyStep(step.id)}
          />
        ))}
      </div>
    </section>
  );
}

function JourneyStep({
  step,
  index,
  hasConnector,
  canInteract,
  onToggle,
}: {
  step: MissionJourneyStep;
  index: number;
  hasConnector: boolean;
  canInteract: boolean;
  onToggle: () => void;
}) {
  const meta = {
    done: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Concluído",
      color: "var(--emerald)",
      className: "atlas-success-panel",
    },
    active: {
      icon: <Sparkles className="h-4 w-4" />,
      label: "Em andamento",
      color: "var(--cyan)",
      className: "atlas-glow-blue",
    },
    blocked: {
      icon: <Lock className="h-4 w-4" />,
      label: "Bloqueado",
      color: "var(--muted-foreground)",
      className: "",
    },
  }[step.state];

  const connectorColor = step.state === "done"
    ? "var(--emerald)"
    : step.state === "active"
      ? "var(--cyan)"
      : "var(--border)";

  return (
    <div className="relative min-w-0">
      {hasConnector && (
        <span
          className="pointer-events-none absolute left-full top-7 z-0 hidden h-px w-3 md:block"
          style={{
            background: `linear-gradient(90deg, ${connectorColor}, var(--border))`,
            boxShadow: step.state !== "blocked" ? `0 0 10px ${connectorColor}` : undefined,
          }}
          aria-hidden
        />
      )}
      <button
        type="button"
        disabled={!canInteract}
        onClick={onToggle}
        className={`relative z-10 h-full w-full rounded-2xl border border-border bg-surface/90 p-3 text-left transition ${canInteract ? "hover:-translate-y-0.5 hover:border-[color:var(--cyan)]/40" : "cursor-default opacity-80"} ${meta.className}`}
      >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">#{String(index).padStart(2, "0")}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-current/35" style={{ color: meta.color, background: `color-mix(in oklab, ${meta.color} 12%, transparent)` }}>
          {meta.icon}
        </span>
      </div>
      <div className="min-h-10 text-sm font-bold leading-tight">{step.label}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta.color }}>
        {meta.label}
      </div>
      </button>
    </div>
  );
}

function ScopeCampaignMap() {
  const { state, actions } = useNucleoState();
  const { scopeTerritories } = state;
  const [draft, setDraft] = useState<NewProjectDraft>(initialNewProjectDraft);

  function createTerritory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    actions.createProject({
      name,
      currentState: "Território recém-cadastrado no mapa estratégico.",
      destination: "Destino V01 a definir.",
      currentMission: draft.currentMission.trim() || "Definir missão atual",
      nextAction: draft.nextAction.trim() || "Definir próxima ação",
      completionCriteria: "Critério de conclusão a definir.",
      risk: draft.risk,
      status: draft.status,
      color: draft.color,
    });
    setDraft(initialNewProjectDraft);
  }

  return (
    <section className="atlas-map-surface p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--cyan)]">Mapa de Escopo</div>
          <h2 className="font-display text-2xl font-bold">Territórios da campanha V01</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {(["No Trilho", "Em Progresso", "Atenção", "Bloqueado", "Concluído"] as ScopeTerritory["status"][]).map((label) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2 py-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: statusTone[label], boxShadow: `0 0 8px ${statusTone[label]}` }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={createTerritory} className="mb-4 grid gap-3 rounded-2xl border border-[color:var(--cyan)]/25 bg-background/25 p-3 lg:grid-cols-[1.1fr_1fr_1fr_130px_130px_auto] lg:items-end">
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Novo território
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nome do projeto"
            className="atlas-input"
          />
        </label>
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Missão
          <input
            value={draft.currentMission}
            onChange={(event) => setDraft((current) => ({ ...current, currentMission: event.target.value }))}
            placeholder="Missão atual"
            className="atlas-input"
          />
        </label>
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Próxima ação
          <input
            value={draft.nextAction}
            onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))}
            placeholder="Acao concreta"
            className="atlas-input"
          />
        </label>
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Risco
          <select
            value={draft.risk}
            onChange={(event) => setDraft((current) => ({ ...current, risk: event.target.value as RiskLevel }))}
            className="atlas-input"
          >
            <option value="low">Baixo</option>
            <option value="med">Médio</option>
            <option value="high">Alto</option>
          </select>
        </label>
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Status
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
            className="atlas-input"
          >
            <option value="planejamento">Planejamento</option>
            <option value="andamento">Em andamento</option>
            <option value="bloqueado">Bloqueado</option>
            <option value="concluido">Concluído</option>
          </select>
        </label>
        <button type="submit" className="atlas-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-[0.14em]">
          <Plus className="h-4 w-4" />
          Criar
        </button>
      </form>

      <div className="relative hidden min-h-[430px] overflow-hidden rounded-2xl border border-border bg-background/20 md:block">
        <svg className="absolute inset-0 h-full w-full opacity-60" aria-hidden>
          <path d="M190 210 C290 85 430 85 550 185" fill="none" stroke="var(--cyan)" strokeOpacity=".28" strokeWidth="2" strokeDasharray="8 10" />
          <path d="M190 210 C300 330 450 345 590 265" fill="none" stroke="var(--violet)" strokeOpacity=".30" strokeWidth="2" strokeDasharray="7 9" />
          <path d="M550 185 C650 215 700 260 760 335" fill="none" stroke="var(--emerald)" strokeOpacity=".24" strokeWidth="2" strokeDasharray="8 10" />
        </svg>
        {scopeTerritories.map((territory) => (
          <TerritoryNode key={territory.id} territory={territory} />
        ))}
      </div>

      <div className="grid gap-3 md:hidden">
        {scopeTerritories.map((territory) => (
          <TerritoryCard key={territory.id} territory={territory} />
        ))}
      </div>
    </section>
  );
}

function TerritoryNode({ territory }: { territory: ScopeTerritory }) {
  const positions: Record<ScopeTerritory["position"], string> = {
    north: "left-[42%] top-[8%] w-[250px]",
    east: "right-[6%] top-[35%] w-[260px]",
    south: "left-[48%] bottom-[7%] w-[260px]",
    west: "left-[5%] top-[37%] w-[260px]",
    center: "left-[34%] top-[37%] w-[280px]",
  };

  return (
    <div className={`absolute ${positions[territory.position]}`}>
      <TerritoryCard territory={territory} />
    </div>
  );
}

function TerritoryCard({ territory }: { territory: ScopeTerritory }) {
  const color = toneColor[territory.tone];
  const content = (
    <>
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
            <MapPin className="h-3.5 w-3.5" />
            Território
          </div>
          <div className="mt-1 truncate font-display text-lg font-bold">{territory.name}</div>
          <div className="text-sm text-muted-foreground">{territory.subtitle}</div>
        </div>
        <div className="font-display text-2xl font-bold" style={{ color }}>{territory.progress}%</div>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${territory.progress}%`, background: color, boxShadow: `0 0 16px ${color}` }} />
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/30 px-2 py-1 text-muted-foreground">
          <ShieldAlert className="h-3 w-3" />
          {territory.status}
        </span>
        <span className="font-mono text-muted-foreground">Nodo {territory.id.slice(0, 3).toUpperCase()}</span>
      </div>
    </>
  );

  const className = "group relative block overflow-hidden rounded-2xl border bg-surface/75 p-4 backdrop-blur transition hover:-translate-y-0.5";
  const style = {
    borderColor: `color-mix(in oklab, ${color} 36%, var(--border))`,
    boxShadow: `0 0 0 1px color-mix(in oklab, ${color} 16%, transparent), 0 20px 40px -24px ${color}`,
  };

  if (territory.projectId) {
    return (
      <Link to="/projeto/$id" params={{ id: territory.projectId }} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

function CommandColumn() {
  return (
    <aside className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
      <BossCard />
      <RiskRadarCard />
      <MentalEnergyCard />
      <FocusCard />
    </aside>
  );
}

function BossCard() {
  const { state } = useNucleoState();
  const { bossItems } = state;

  return (
    <section className="atlas-danger-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[color:var(--rose)]">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-display text-lg font-bold">Boss de Hoje</h2>
        </div>
        <span className="rounded-full border border-[color:var(--rose)]/40 bg-background/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--rose)]">
          3 urgentes
        </span>
      </div>
      <ul className="grid gap-2">
        {bossItems.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-background/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold leading-tight">{item.title}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{item.detail}</div>
              </div>
              <span className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold" style={{ color: item.priority === "Alta" ? "var(--rose)" : "var(--amber)", background: item.priority === "Alta" ? "color-mix(in oklab, var(--rose) 14%, transparent)" : "color-mix(in oklab, var(--amber) 14%, transparent)" }}>
                {item.priority}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Hourglass className="h-3.5 w-3.5" />
              {item.due}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RiskRadarCard() {
  const { state } = useNucleoState();
  const { riskRadar } = state;
  const radarItems = [
    ...riskRadar.items,
    ...state.alerts.slice(0, 2).map((alert) => alert.text),
  ];

  return (
    <section className="atlas-panel p-4">
      <div className="mb-3 flex items-center gap-2 text-[color:var(--amber)]">
        <Radar className="h-5 w-5" />
        <h2 className="font-display text-lg font-bold">{riskRadar.headline}</h2>
      </div>
      <ul className="grid gap-2">
        {radarItems.map((item) => (
          <li key={item} className="flex items-start gap-2 rounded-xl border border-border bg-background/25 p-3 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--amber)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MentalEnergyCard() {
  const { state } = useNucleoState();
  const { mentalEnergy } = state;

  return (
    <section className="atlas-success-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[color:var(--emerald)]">
          <BatteryCharging className="h-5 w-5" />
          <h2 className="font-display text-lg font-bold">Energia Mental</h2>
        </div>
        <span className="font-display text-2xl font-bold text-[color:var(--emerald)]">{mentalEnergy.value}%</span>
      </div>
      <div className="mb-3 flex h-16 items-end gap-1.5 rounded-xl border border-border bg-background/25 p-2">
        {mentalEnergy.trend.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="flex-1 rounded-t bg-[linear-gradient(180deg,var(--emerald),var(--cyan))] opacity-80"
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
      <div className="text-sm font-bold text-[color:var(--emerald)]">Status: {mentalEnergy.status}</div>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{mentalEnergy.note}</p>
    </section>
  );
}

function FocusCard() {
  const navigate = useNavigate();
  const { state, actions } = useNucleoState();
  const { focusToday } = state;

  function startFocus() {
    actions.startFocusSession();
    void navigate({ to: "/foco" });
  }

  return (
    <section className="atlas-panel atlas-glow-purple p-4">
      <div className="mb-3 flex items-center gap-2 text-[color:var(--violet)]">
        <Timer className="h-5 w-5" />
        <h2 className="font-display text-lg font-bold">Foco de Hoje</h2>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-4xl font-bold text-[color:var(--violet)]">{focusToday.duration}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">reservado para execução</div>
        </div>
        <Zap className="h-9 w-9 text-[color:var(--amber)]" />
      </div>
      <button
        type="button"
        onClick={startFocus}
        className="atlas-cta mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-[0.14em]"
      >
        {focusToday.cta}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function OperationalRow() {
  const { state, actions } = useNucleoState();
  const { operationalCards } = state;
  const recentVictories = state.victories.slice(0, 5);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BottomPanel icon={<Ban className="h-4 w-4" />} title="Não Fazer Hoje" tone="rose" className="atlas-danger-panel">
        <ul className="grid gap-2">
          {operationalCards.doNotToday.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-background/25 p-3">
              <div className="flex items-start gap-2 text-sm leading-snug">
                <span
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.status === "avoided"
                      ? "bg-[color:var(--emerald)] shadow-[0_0_8px_var(--emerald)]"
                      : item.status === "violated"
                        ? "bg-[color:var(--rose)] shadow-[0_0_8px_var(--rose)]"
                        : "bg-[color:var(--amber)] shadow-[0_0_8px_var(--amber)]"
                  }`}
                />
                <span>{item.text}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => actions.markDoNotTodayAvoided(item.id)}
                  className="rounded-lg border border-[color:var(--emerald)]/30 bg-[color:color-mix(in_oklab,var(--emerald)_10%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--emerald)] transition hover:bg-[color:color-mix(in_oklab,var(--emerald)_16%,transparent)]"
                >
                  Evitei
                </button>
                <button
                  type="button"
                  onClick={() => actions.markDoNotTodayViolated(item.id)}
                  className="rounded-lg border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_10%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--rose)] transition hover:bg-[color:color-mix(in_oklab,var(--rose)_16%,transparent)]"
                >
                  Caí nisso
                </button>
              </div>
            </li>
          ))}
        </ul>
      </BottomPanel>

      <BottomPanel icon={<Hourglass className="h-4 w-4" />} title="Aguardando Terceiros" tone="cyan">
        <ul className="grid gap-2">
          {operationalCards.waitingThirdParties.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-background/25 p-3">
              <div className="font-semibold">{item.source}</div>
              <div className="text-sm text-muted-foreground">{item.topic}</div>
              <div className="mt-1 font-mono text-xs text-[color:var(--cyan)]">{item.days}</div>
            </li>
          ))}
        </ul>
      </BottomPanel>

      <BottomPanel icon={<Flag className="h-4 w-4" />} title="Entrega V01" tone="amber" className="atlas-gold-border">
        <div className="rounded-xl border border-border bg-background/25 p-3">
          <div className="font-display text-lg font-bold">{operationalCards.deliveryV01.title}</div>
          <div className="mt-2 text-sm text-muted-foreground">{operationalCards.deliveryV01.due}</div>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--amber)]">
            <CheckCircle2 className="h-4 w-4" />
            {operationalCards.deliveryV01.progress}
          </div>
        </div>
      </BottomPanel>

      <BottomPanel icon={<Trophy className="h-4 w-4" />} title="Vitórias Recentes" tone="emerald" className="atlas-success-panel">
        <ul className="grid gap-2">
          {recentVictories.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/25 p-3">
              <span className="text-sm font-semibold leading-snug">{item.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{item.when}</span>
            </li>
          ))}
        </ul>
      </BottomPanel>
    </section>
  );
}

function BottomPanel({
  icon,
  title,
  tone,
  className = "atlas-panel",
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: "rose" | "cyan" | "amber" | "emerald";
  className?: string;
  children: ReactNode;
}) {
  const color = `var(--${tone})`;
  return (
    <section className={`${className} p-4`}>
      <div className="mb-3 flex items-center gap-2" style={{ color }}>
        {icon}
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export { Shell };
