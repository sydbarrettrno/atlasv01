import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import type { NucleoEntityAction } from "@/lib/nucleo-data";
import { Archive, CheckCircle2, Clock, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/arquivo")({
  head: () => ({ meta: [{ title: "Arquivo · Núcleo" }] }),
  component: ArchivePage,
});

const actionLabel: Record<NucleoEntityAction, string> = {
  created: "Criado",
  updated: "Atualizado",
  completed: "Concluído",
  reopened: "Reaberto",
  moved: "Movido",
  archived: "Arquivado",
  restored: "Restaurado",
  deleted: "Removido",
  evidence_added: "Evidência",
  focus_started: "Foco iniciado",
  focus_completed: "Foco concluído",
  drift_avoided: "Desvio evitado",
  drift_violated: "Desvio registrado",
};

function ArchivePage() {
  const { state } = useNucleoState();
  const archiveItems = state.archiveItems.filter((item) => !item.restoredAt);
  const history = state.history.slice(0, 20);

  return (
    <Shell>
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <Archive className="h-3.5 w-3.5" /> Arquivo
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">Memória de execução.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico local, itens arquivados e rastros de foco ficam concentrados aqui.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Eventos" value={state.history.length} tone="cyan" />
          <Metric label="Arquivados" value={archiveItems.length} tone="amber" />
          <Metric label="Vitórias" value={state.victories.length} tone="emerald" />
        </section>

        {archiveItems.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface/60">
            <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--amber)]">
              <RotateCcw className="h-4 w-4" /> Itens arquivados
            </header>
            <div className="divide-y divide-border px-4">
              {archiveItems.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.entityType} · {formatDate(item.archivedAt)}{item.reason ? ` · ${item.reason}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="relative pl-6">
          <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
          {history.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground">
              Nenhum evento registrado ainda.
            </div>
          )}
          {history.map((event) => (
            <div key={event.id} className="relative mb-4">
              <span className="absolute -left-[18px] top-1 grid h-4 w-4 place-items-center rounded-full border border-[color:var(--emerald)] bg-background">
                <CheckCircle2 className="h-3 w-3 text-[color:var(--emerald)]" />
              </span>
              <div className="rounded-2xl border border-border bg-surface/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {actionLabel[event.action]} · {event.entityType}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(event.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-sm font-semibold">{event.title}</div>
                {event.summary && <p className="mt-1 text-xs text-muted-foreground">{event.summary}</p>}
              </div>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "cyan" | "amber" | "emerald" }) {
  const color = `var(--${tone})`;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
