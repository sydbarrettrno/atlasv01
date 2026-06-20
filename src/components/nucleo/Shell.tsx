import { Link, useRouterState } from "@tanstack/react-router";
import {
  Map,
  Sword,
  Target,
  CalendarRange,
  Archive,
  Sparkles,
  Settings,
  Moon,
  Flame,
  Zap,
  Layers,
} from "lucide-react";
import { owner } from "@/lib/nucleo-data";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Mapa Estratégico", icon: Map, exact: true },
  { to: "/jornada", label: "Jornada RPG", icon: Sword },
  { to: "/foco", label: "Modo Foco", icon: Target },
  { to: "/semana", label: "Revisão Semanal", icon: CalendarRange },
  { to: "/v02", label: "Portal V02", icon: Layers },
  { to: "/arquivo", label: "Arquivo", icon: Archive },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen text-foreground">
      {/* ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.07]" aria-hidden />
      <div className="pointer-events-none fixed inset-0" aria-hidden style={{ background: "var(--gradient-glow)" }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl glass shadow-[var(--shadow-elevated)] lg:flex">
          <div className="flex items-center gap-3 border-b border-border px-5 py-5">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <div className="absolute inset-0 rounded-xl animate-pulse-ring" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold leading-tight tracking-wider">NÚCLEO</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">de Projetos</div>
            </div>
          </div>

          {/* Profile */}
          <div className="mx-4 mt-4 rounded-xl border border-border bg-surface/60 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{owner.name}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--emerald)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                  {owner.mode}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-surface/80 hover:text-foreground",
                  )}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-xl border border-[color:var(--cyan)]/40"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.78 0.16 210 / 0.18), oklch(0.72 0.20 295 / 0.10))",
                        boxShadow: "inset 0 1px 0 0 oklch(1 0 0 / 0.06), 0 0 24px -8px oklch(0.78 0.16 210 / 0.4)",
                      }}
                    />
                  )}
                  <Icon className={cn("relative h-4 w-4 shrink-0", active && "text-[color:var(--cyan)]")} />
                  <span className="relative truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Focus card */}
          <div className="m-4 rounded-xl border border-border bg-surface/60 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Foco de hoje</div>
            <div className="mt-3 flex items-center gap-3">
              <FocusRing value={owner.focusToday} />
              <div>
                <div className="font-display text-2xl font-bold text-[color:var(--cyan)]">{owner.focusToday}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">foco</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">Excelente. Continue assim!</div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-mono text-xs">
              <span className="text-foreground">{owner.focusTime}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">tempo de foco</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border px-5 py-4">
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
              Configurações
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="font-display text-sm font-bold tracking-wider">NÚCLEO</div>
            </div>
            <MobileNav pathname={pathname} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 p-1">
      {navItems.slice(0, 3).map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              active ? "bg-surface-2 text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </div>
  );
}

function FocusRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke="url(#focusGrad)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
      <defs>
        <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.16 210)" />
          <stop offset="100%" stopColor="oklch(0.72 0.20 295)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TopMetricsBar() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard
        icon={<Flame className="h-5 w-5" />}
        label="Foco Streak"
        value={`${owner.streak}`}
        suffix="dias"
        accent="amber"
      />
      <MetricCard
        icon={<Zap className="h-5 w-5" />}
        label="Progresso Geral"
        value="68%"
        accent="cyan"
      />
      <MetricCard
        icon={<Target className="h-5 w-5" />}
        label="Escopo Atendido"
        value="76%"
        accent="emerald"
      />
      <MetricCard
        icon={<CalendarRange className="h-5 w-5" />}
        label="Ciclo de Foco"
        value="24:00"
        accent="violet"
      />
    </div>
  );
}

function MetricCard({
  icon, label, value, suffix, accent,
}: { icon: ReactNode; label: string; value: string; suffix?: string; accent: "amber" | "cyan" | "emerald" | "violet" }) {
  const colorVar = `var(--${accent})`;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 backdrop-blur">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: colorVar }} />
      <div className="relative flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border" style={{ background: `color-mix(in oklab, ${colorVar} 16%, transparent)`, color: colorVar }}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold tracking-tight" style={{ color: colorVar }}>{value}</span>
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
