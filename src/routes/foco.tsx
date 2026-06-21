import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import { getFocusSessionElapsedSeconds } from "@/lib/nucleo-rules";
import type { FocusSessionResult } from "@/lib/nucleo-data";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Pause,
  Play,
  Send,
  Square,
  Target,
  Timer,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/foco")({
  head: () => ({ meta: [{ title: "Modo Foco · Núcleo" }] }),
  component: FocusMode,
});

const resultLabels: Record<FocusSessionResult, string> = {
  avancei: "Avancei",
  travei: "Travei",
  desviei: "Desviei",
  concluido: "Concluído",
};

function FocusMode() {
  const { state, actions, activeFocusSession } = useNucleoState();
  const [now, setNow] = useState(Date.now());
  const [finishing, setFinishing] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<FocusSessionResult>("avancei");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");

  const targetSeconds = useMemo(() => {
    const minutes = Number.parseInt(state.todayMission.suggestedTime, 10);
    return Number.isFinite(minutes) ? minutes * 60 : 90 * 60;
  }, [state.todayMission.suggestedTime]);

  useEffect(() => {
    if (activeFocusSession?.status !== "running") return;

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeFocusSession?.status]);

  const elapsedSeconds = activeFocusSession
    ? getFocusSessionElapsedSeconds(activeFocusSession, now)
    : 0;
  const pct = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");
  const primaryProject = state.projects.find((project) => project.id === state.todayMission.projectId);

  function startFocus() {
    setConfirmation("");
    setFinishing(false);
    actions.startFocusSession();
  }

  function cancelFocus() {
    setFinishing(false);
    setConfirmation("Sessão cancelada. Sem problema: o escopo continua protegido.");
    actions.cancelFocusSession();
  }

  function registerSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.finishFocusSession({ result, note, evidence });
    setConfirmation("Sessão registrada no diário de foco local.");
    setFinishing(false);
    setResult("avancei");
    setNote("");
    setEvidence("");
  }

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Centro de comando
          </Link>
          <div className="rounded-xl border border-border bg-surface/60 px-3 py-2 font-mono text-xs text-muted-foreground">
            XP {state.dashboardStats.xpCurrent.toLocaleString("pt-BR")} · Nível {state.dashboardStats.level}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--cyan)]">
            <Target className="h-3.5 w-3.5" /> Modo Foco
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Uma missão. Uma janela. Um avanço.</h1>
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-[color:var(--amber)]" />
                {primaryProject?.name ?? state.todayMission.projectTag}
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">{state.todayMission.mission}</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{state.todayMission.nextAction}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat label="Status" value={activeFocusSession?.status ?? "pronto"} />
                <Stat label="Meta" value={state.todayMission.suggestedTime} />
                <Stat label="Progresso" value={`${pct}%`} />
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-[color:var(--cyan)]/25 bg-surface/60 p-5">
            <div className="mb-3 flex items-center gap-2 text-[color:var(--cyan)]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Critério de conclusão</span>
            </div>
            <ul className="grid gap-2">
              {state.todayMission.completionChecklist.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-background/25 px-3 py-2 text-sm">
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="rounded-3xl border border-border bg-surface/55 p-6">
          <div className="relative mx-auto grid h-72 w-72 place-items-center sm:h-80 sm:w-80">
            <svg width="100%" height="100%" viewBox="0 0 320 320" className="-rotate-90">
              <circle cx="160" cy="160" r="140" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="url(#fgrad)"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 140}
                strokeDashoffset={2 * Math.PI * 140 - (pct / 100) * 2 * Math.PI * 140}
              />
              <defs>
                <linearGradient id="fgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.82 0.16 210)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.20 295)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-mono text-6xl font-bold tabular-nums">{mm}:{ss}</div>
                <div className="mt-1 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" /> sessão local
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {!activeFocusSession && (
              <button onClick={startFocus} className="atlas-cta inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold">
                <Play className="h-4 w-4" /> Iniciar foco
              </button>
            )}
            {activeFocusSession?.status === "running" && (
              <button onClick={actions.pauseFocusSession} className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface/70 px-6 font-semibold hover:text-[color:var(--cyan)]">
                <Pause className="h-4 w-4" /> Pausar
              </button>
            )}
            {activeFocusSession?.status === "paused" && (
              <button onClick={actions.resumeFocusSession} className="atlas-cta inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold">
                <Play className="h-4 w-4" /> Retomar
              </button>
            )}
            {activeFocusSession && (
              <>
                <button onClick={() => setFinishing(true)} className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--emerald)]/35 bg-[color:color-mix(in_oklab,var(--emerald)_12%,transparent)] px-6 font-semibold text-[color:var(--emerald)]">
                  <Send className="h-4 w-4" /> Finalizar
                </button>
                <button onClick={cancelFocus} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface/60 hover:text-[color:var(--rose)]" aria-label="Cancelar sessão">
                  <Square className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {confirmation && (
            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[color:var(--emerald)]/30 bg-[color:color-mix(in_oklab,var(--emerald)_10%,transparent)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--emerald)]">
              {confirmation}
            </div>
          )}
        </section>

        {finishing && (
          <form onSubmit={registerSession} className="rounded-3xl border border-border bg-surface/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Registrar sessão</h2>
                <p className="text-sm text-muted-foreground">Salva no histórico local, recalcula XP e registra vitória quando houver avanço.</p>
              </div>
              <button type="button" onClick={() => setFinishing(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/25 text-muted-foreground hover:text-foreground">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
              <label className="grid gap-2 text-sm font-semibold">
                Resultado
                <select
                  value={result}
                  onChange={(event) => setResult(event.target.value as FocusSessionResult)}
                  className="rounded-xl border border-border bg-background/40 px-3 py-3 text-foreground outline-none focus:border-[color:var(--cyan)]"
                >
                  {(Object.keys(resultLabels) as FocusSessionResult[]).map((key) => (
                    <option key={key} value={key}>{resultLabels[key]}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Evidência simples
                <input
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                  placeholder="Ex.: escopo V01 separado em três blocos"
                  className="rounded-xl border border-border bg-background/40 px-3 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--cyan)]"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm font-semibold">
              Nota rápida
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="O que avançou, travou ou desviou?"
                rows={3}
                className="resize-none rounded-xl border border-border bg-background/40 px-3 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--cyan)]"
              />
            </label>

            <button type="submit" className="atlas-cta mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold uppercase tracking-[0.14em]">
              Registrar sessão
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/25 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
