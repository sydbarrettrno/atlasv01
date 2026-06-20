import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { primaryProject, owner } from "@/lib/nucleo-data";
import { Target, Crown, Pause, Play, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/foco")({
  head: () => ({ meta: [{ title: "Modo Foco · Núcleo" }] }),
  component: FocusMode,
});

function FocusMode() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = ((25 * 60 - seconds) / (25 * 60)) * 100;

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-8 py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--cyan)]">
            <Target className="h-3.5 w-3.5" /> Modo Foco
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">Uma coisa por vez.</h1>
        </div>

        {/* Mission */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-8 text-center">
          <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-[color:var(--amber)]" /> {primaryProject.name}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">{primaryProject.currentMission}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{primaryProject.nextAction}</p>
          </div>
        </div>

        {/* Timer */}
        <div className="relative mx-auto grid h-80 w-80 place-items-center">
          <svg width="320" height="320" viewBox="0 0 320 320" className="-rotate-90">
            <circle cx="160" cy="160" r="140" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="160" cy="160" r="140" fill="none" stroke="url(#fgrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 140}
              strokeDashoffset={2 * Math.PI * 140 - (pct / 100) * 2 * Math.PI * 140} />
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
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ciclo Foco · 25min</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setRunning((r) => !r)} className="inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold text-primary-foreground shadow-lg transition hover:brightness-110" style={{ background: "var(--gradient-primary)", boxShadow: "0 12px 32px -8px oklch(0.78 0.16 210 / 0.5)" }}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? "Pausar" : "Iniciar foco"}
          </button>
          <button onClick={() => { setSeconds(25 * 60); setRunning(false); }} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface/60 hover:text-[color:var(--cyan)]">
            <SkipForward className="h-4 w-4" />
          </button>
          <button className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface/60 hover:text-[color:var(--cyan)]">
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          <Stat label="Foco hoje" value={`${owner.focusToday}%`} />
          <Stat label="Streak" value={`${owner.streak}d`} />
          <Stat label="Tempo de foco" value={owner.focusTime} />
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
