import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock,
  Hourglass,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/semana")({
  head: () => ({ meta: [{ title: "Revisão Semanal · Núcleo" }] }),
  component: Weekly,
});

function Weekly() {
  const { state } = useNucleoState();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const completedSessions = state.focusSessions.filter((session) => {
    const when = new Date(session.endedAt ?? session.startedAt);
    return session.status === "completed" && when >= weekStart;
  });
  const driftLog = state.antiDriftLog.filter((entry) => new Date(entry.createdAt) >= weekStart);
  const xpGained = completedSessions.reduce((sum, session) => sum + session.xpEarned, 0)
    + driftLog.reduce((sum, entry) => sum + entry.xpEarned, 0);
  const totalFocusSeconds = completedSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const avoided = driftLog.filter((entry) => entry.status === "avoided").length;
  const violated = driftLog.filter((entry) => entry.status === "violated").length;
  const victories = state.victories.slice(0, 6).map((victory) => `${victory.text} · ${victory.when}`);

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
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-2 font-mono text-sm">
            Últimos 7 dias
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={<Clock className="h-5 w-5" />} label="Sessões concluídas" value={`${completedSessions.length}`} tone="cyan" />
          <Metric icon={<Zap className="h-5 w-5" />} label="XP registrado" value={`+${xpGained}`} tone="amber" />
          <Metric icon={<ShieldCheck className="h-5 w-5" />} label="Desvios evitados" value={`${avoided}`} tone="emerald" />
          <Metric icon={<AlertTriangle className="h-5 w-5" />} label="Desvios violados" value={`${violated}`} tone="rose" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface/60 p-5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--violet)]">
                  <Sparkles className="h-4 w-4" /> Diário de foco
                </div>
                <h2 className="mt-1 font-display text-xl font-bold">Histórico local da semana</h2>
              </div>
              <div className="font-display text-3xl font-bold text-[color:var(--violet)]">{formatDuration(totalFocusSeconds)}</div>
            </div>

            <ul className="mt-4 divide-y divide-border">
              {completedSessions.length === 0 && (
                <li className="py-4 text-sm text-muted-foreground">Nenhuma sessão concluída registrada nesta semana.</li>
              )}
              {completedSessions.slice(0, 7).map((session) => (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm font-semibold">{resultLabel(session.result)} · {formatDuration(session.durationSeconds)}</div>
                    <div className="text-xs text-muted-foreground">{session.evidence || session.note || "Sem evidência registrada"}</div>
                  </div>
                  <span className="rounded-lg border border-[color:var(--amber)]/30 bg-[color:color-mix(in_oklab,var(--amber)_10%,transparent)] px-2 py-1 font-mono text-xs text-[color:var(--amber)]">
                    +{session.xpEarned} XP
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <List title="Vitórias Recentes" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" items={victories} />
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <List
            title="Aguardando Resposta"
            icon={<Hourglass className="h-4 w-4" />}
            tone="amber"
            items={state.operationalCards.waitingThirdParties.map((item) => `${item.source} · ${item.topic} · ${item.days}`)}
          />
          <List
            title="Fora do Escopo / V02"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="rose"
            items={state.operationalCards.doNotToday.map((item) => item.text)}
          />
          <List
            title="Alertas"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="rose"
            items={state.alerts.length > 0 ? state.alerts.slice(0, 5).map((alert) => alert.text) : ["Sem alertas críticos no histórico local."]}
          />
        </div>
      </div>
    </Shell>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
}) {
  const color = `var(--${tone})`;
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-current/30" style={{ color }}>
          {icon}
        </div>
        <span className="font-display text-3xl font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

function List({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "rose";
  items: string[];
}) {
  const c = `var(--${tone})`;
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        {icon}{title}
      </header>
      <ul className="divide-y divide-border px-4">
        {items.map((text, index) => (
          <li key={`${text}-${index}`} className="flex gap-2 py-2.5 text-sm">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: c }} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function resultLabel(result: string | undefined) {
  const labels: Record<string, string> = {
    avancei: "Avancei",
    travei: "Travei",
    desviei: "Desviei",
    concluido: "Concluído",
  };
  return result ? labels[result] ?? result : "Registrado";
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return `${hours}h${String(minutes).padStart(2, "0")}m`;
}
