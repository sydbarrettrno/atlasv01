import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import { Layers, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/v02")({
  head: () => ({ meta: [{ title: "Portal V02 · Núcleo" }] }),
  component: V02,
});

function V02() {
  const { state } = useNucleoState();
  const all = state.projects.flatMap((p) =>
    p.scope.filter((s) => s.bucket === "v02").map((s) => ({ ...s, project: p })),
  );
  return (
    <Shell>
      <div className="space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-[color:var(--violet)]/40 p-8" style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--violet) 16%, transparent), oklch(0.18 0.04 260))" }}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--violet)" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--violet)]">
              <Layers className="h-3.5 w-3.5" /> Portal V02
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold">Tudo que não entra no V01 passa por aqui.</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ideias, ampliações e refinamentos ficam aqui para não poluir o foco atual.
            </p>
          </div>
        </header>

        <div className="grid gap-3">
          {all.map((s) => {
            const c = `var(--${s.project.color})`;
            return (
              <Link
                key={s.id + s.project.id}
                to="/projeto/$id"
                params={{ id: s.project.id }}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-[color:var(--violet)]/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border font-mono text-xs" style={{ color: c }}>{s.project.code}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{s.text}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{s.project.name}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[color:var(--violet)]" />
              </Link>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
