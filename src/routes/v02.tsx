import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  Ban,
  Layers,
  Pencil,
  Plus,
  Save,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import type { Project, ScopeItem } from "@/lib/nucleo-data";

type PortalItem = ScopeItem & { project: Project };
type Notice = { tone: "emerald" | "amber" | "rose"; text: string };

export const Route = createFileRoute("/v02")({
  head: () => ({ meta: [{ title: "Portal V02 · Núcleo" }] }),
  component: V02,
});

function V02() {
  const { state, actions } = useNucleoState();
  const [selectedProjectId, setSelectedProjectId] = useState(state.projects[0]?.id ?? "");
  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState<{ projectId: string; itemId: string; text: string } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const all: PortalItem[] = state.projects.flatMap((project) =>
    project.scope.filter((scope) => scope.bucket === "v02").map((scope) => ({ ...scope, project })),
  );
  const canAdd = Boolean(selectedProjectId && newItem.trim());

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => {
      setNotice((current) => (current?.text === nextNotice.text ? null : current));
    }, 3200);
  }

  useEffect(() => {
    if (selectedProjectId || state.projects.length === 0) return;
    setSelectedProjectId(state.projects[0].id);
  }, [selectedProjectId, state.projects]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) {
      showNotice({ tone: "amber", text: "Digite uma ideia antes de enviar para o Portal V02." });
      return;
    }

    actions.createScopeItem(selectedProjectId, { bucket: "v02", text: newItem });
    setNewItem("");
    showNotice({ tone: "emerald", text: "Item guardado no Portal V02." });
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    if (!editing.text.trim()) {
      showNotice({ tone: "amber", text: "O item V02 precisa manter uma descrição." });
      return;
    }

    actions.updateScopeItem(editing.projectId, editing.itemId, editing.text);
    setEditing(null);
    showNotice({ tone: "emerald", text: "Item V02 atualizado." });
  }

  function archiveItem(item: PortalItem) {
    const confirmed = window.confirm(`Arquivar "${item.text}" do Portal V02?`);
    if (!confirmed) return;

    actions.archiveScopeItem(item.project.id, item.id);
    showNotice({ tone: "amber", text: "Item arquivado." });
  }

  return (
    <Shell>
      <div className="space-y-6">
        <header
          className="relative overflow-hidden rounded-3xl border border-[color:var(--violet)]/40 p-8"
          style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--violet) 16%, transparent), oklch(0.18 0.04 260))" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--violet)" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--violet)]">
              <Layers className="h-3.5 w-3.5" /> Portal V02
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold">Tudo que não entra no V01 passa por aqui.</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ideias, ampliações e refinamentos ficam separados do foco atual para evitar desvio de escopo.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-[color:var(--violet)]/35 bg-surface/70 p-4 shadow-[0_24px_80px_-52px_var(--violet)]">
          <form onSubmit={addItem} className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Projeto
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="atlas-input">
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Novo item V02
              <input value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="Ideia para depois, sem abrir nova frente hoje" className="atlas-input" />
            </label>
            <button type="submit" disabled={!canAdd} className="atlas-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </form>
          {notice && <NoticeBanner tone={notice.tone}>{notice.text}</NoticeBanner>}
        </section>

        <div className="grid gap-3">
          {all.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface/60 p-5 text-sm text-muted-foreground">
              Nenhum item no Portal V02.
            </div>
          )}

          {all.map((item) => {
            const c = `var(--${item.project.color})`;
            const isEditing = editing?.itemId === item.id && editing.projectId === item.project.id;

            return (
              <article
                key={`${item.project.id}-${item.id}`}
                className="rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-[color:var(--violet)]/50"
              >
                {isEditing ? (
                  <form onSubmit={saveItem} className="flex gap-2">
                    <input
                      value={editing.text}
                      onChange={(event) => setEditing({ ...editing, text: event.target.value })}
                      className="atlas-input min-w-0 flex-1"
                    />
                    <IconButton label="Salvar item" tone="emerald" type="submit"><Save className="h-4 w-4" /></IconButton>
                    <IconButton label="Cancelar edição" tone="muted" onClick={() => setEditing(null)}><X className="h-4 w-4" /></IconButton>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border font-mono text-xs" style={{ color: c }}>
                        {item.project.code}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{item.text}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{item.project.name}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ projectId: item.project.id, itemId: item.id, text: item.text })}
                        className="rounded-lg border border-border bg-background/25 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="mr-1 inline h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.moveScopeItem(item.project.id, item.id, "v01")}
                        className="rounded-lg border border-[color:var(--cyan)]/30 bg-[color:color-mix(in_oklab,var(--cyan)_8%,transparent)] px-2.5 py-1.5 text-[11px] font-bold text-[color:var(--cyan)]"
                      >
                        <Target className="mr-1 inline h-3.5 w-3.5" />
                        V01
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.moveScopeItem(item.project.id, item.id, "fora")}
                        className="rounded-lg border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] px-2.5 py-1.5 text-[11px] font-bold text-[color:var(--rose)]"
                      >
                        <Ban className="mr-1 inline h-3.5 w-3.5" />
                        Fora
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveItem(item)}
                        className="rounded-lg border border-border bg-background/25 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-[color:var(--rose)]"
                      >
                        <Archive className="mr-1 inline h-3.5 w-3.5" />
                        Arquivar
                      </button>
                      <Link
                        to="/projeto/$id"
                        params={{ id: item.project.id }}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/25 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-[color:var(--violet)]"
                      >
                        Projeto
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function IconButton({
  label,
  tone,
  type = "button",
  onClick,
  children,
}: {
  label: string;
  tone: "emerald" | "muted";
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const color = tone === "muted" ? "var(--muted-foreground)" : `var(--${tone})`;
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background/25 transition hover:-translate-y-0.5"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 32%, var(--border))` }}
    >
      {children}
    </button>
  );
}

function NoticeBanner({ tone, children }: { tone: Notice["tone"]; children: React.ReactNode }) {
  const color = `var(--${tone})`;

  return (
    <div className="mt-3 rounded-xl border bg-background/25 px-3 py-2 text-sm font-semibold" style={{ color, borderColor: `color-mix(in oklab, ${color} 34%, var(--border))` }}>
      {children}
    </div>
  );
}
