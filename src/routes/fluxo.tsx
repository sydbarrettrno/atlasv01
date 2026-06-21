import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Circle,
  GripVertical,
  ListChecks,
  Lock,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import type { NucleoTask, Project, ScopeItem, TaskPriority, TaskStatus } from "@/lib/nucleo-data";

type TaskDraft = {
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  scopeBucket: ScopeItem["bucket"];
};

type EditingTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  scopeBucket: ScopeItem["bucket"];
  status: TaskStatus;
};

const priorityLabel: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const statusLabel: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Pronta",
  in_focus: "Em foco",
  blocked: "Bloqueada",
  done: "Concluída",
  archived: "Arquivada",
};

const bucketLabel: Record<ScopeItem["bucket"], string> = {
  v01: "V01",
  v02: "V02",
  fora: "Fora",
};

export const Route = createFileRoute("/fluxo")({
  head: () => ({ meta: [{ title: "Fluxo · Núcleo" }] }),
  component: FlowPage,
});

function FlowPage() {
  const navigate = useNavigate();
  const { state, actions, activeFocusSession } = useNucleoState();
  const firstProject = state.projects[0];
  const [draft, setDraft] = useState<TaskDraft>({
    projectId: firstProject?.id ?? "",
    title: "",
    description: "",
    priority: "medium",
    scopeBucket: "v01",
  });
  const [editing, setEditing] = useState<EditingTask | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const projectById = useMemo(() => new Map(state.projects.map((project) => [project.id, project])), [state.projects]);
  const activeTasks = state.tasks
    .filter((task) => task.status !== "archived")
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  const queueTasks = activeTasks.filter((task) => task.status !== "done");
  const doneAll = activeTasks.filter((task) => task.status === "done");
  const doneTasks = doneAll.slice(0, 6);
  const blockedTasks = activeTasks.filter((task) => task.status === "blocked");
  const readyTasks = activeTasks.filter((task) => task.status === "ready" || task.status === "backlog");
  const focusTask = activeFocusSession?.taskId ? state.tasks.find((task) => task.id === activeFocusSession.taskId) : undefined;

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.projectId) return;

    actions.createTask({
      projectId: draft.projectId,
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      scopeBucket: draft.scopeBucket,
      status: "ready",
    });
    setDraft((current) => ({ ...current, title: "", description: "" }));
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    actions.updateTask(editing.id, {
      title: editing.title,
      description: editing.description,
      priority: editing.priority,
      scopeBucket: editing.scopeBucket,
      status: editing.status,
    });
    setEditing(null);
  }

  function startFocus(taskId: string) {
    actions.startFocusSession(taskId);
    void navigate({ to: "/foco" });
  }

  function dropTask(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const ids = queueTasks.map((task) => task.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDraggedId(null);
      return;
    }

    const nextIds = [...ids];
    const [moved] = nextIds.splice(from, 1);
    nextIds.splice(to, 0, moved);
    actions.reorderTasks(nextIds);
    setDraggedId(null);
  }

  return (
    <Shell>
      <div className="space-y-6 pb-8">
        <header className="relative overflow-hidden rounded-3xl border border-[color:var(--cyan)]/35 bg-surface/70 p-6 md:p-8">
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[color:var(--cyan)] opacity-20 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--cyan)]">
                <ListChecks className="h-3.5 w-3.5" /> Fluxo Operacional
              </div>
              <h1 className="mt-2 font-display text-4xl font-bold">Fila de execução, uma próxima ação por vez.</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Cadastre, organize, arraste e leve tarefas para o foco sem abrir um Kanban.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/25 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--amber)]">
                <Sparkles className="h-4 w-4" /> Foco atual
              </div>
              <div className="mt-2 text-sm font-semibold">{focusTask?.title ?? "Nenhuma tarefa em foco agora"}</div>
              {focusTask && (
                <div className="mt-1 text-xs text-muted-foreground">{projectById.get(focusTask.projectId)?.name}</div>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Na fila" value={queueTasks.length} tone="cyan" />
          <Metric label="Prontas" value={readyTasks.length} tone="emerald" />
          <Metric label="Bloqueadas" value={blockedTasks.length} tone="rose" />
          <Metric label="Concluídas" value={doneAll.length} tone="amber" />
        </section>

        <section className="rounded-2xl border border-border bg-surface/60 p-4">
          <form onSubmit={createTask} className="grid gap-3 xl:grid-cols-[220px_minmax(0,1.1fr)_minmax(0,1fr)_130px_130px_auto] xl:items-end">
            <Field label="Projeto">
              <select value={draft.projectId} onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))} className="atlas-input">
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Nova tarefa">
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Próxima ação concreta" className="atlas-input" />
            </Field>
            <Field label="Detalhe">
              <input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Contexto curto" className="atlas-input" />
            </Field>
            <Field label="Prioridade">
              <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className="atlas-input">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </Field>
            <Field label="Escopo">
              <select value={draft.scopeBucket} onChange={(event) => setDraft((current) => ({ ...current, scopeBucket: event.target.value as ScopeItem["bucket"] }))} className="atlas-input">
                <option value="v01">V01</option>
                <option value="v02">V02</option>
                <option value="fora">Fora</option>
              </select>
            </Field>
            <button type="submit" className="atlas-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-[0.14em]">
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </form>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-border bg-surface/60">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--cyan)]">
                <Target className="h-4 w-4" /> Fila de próximas ações
              </div>
              <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
            </header>
            <div className="grid gap-3 p-3">
              {queueTasks.length === 0 && (
                <div className="rounded-xl border border-border bg-background/25 p-4 text-sm text-muted-foreground">
                  Nenhuma tarefa aberta. Crie uma próxima ação para começar.
                </div>
              )}

              {queueTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  project={projectById.get(task.projectId)}
                  dragging={draggedId === task.id}
                  editing={editing}
                  onDragStart={() => setDraggedId(task.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDrop={() => dropTask(task.id)}
                  onEdit={() => setEditing({
                    id: task.id,
                    title: task.title,
                    description: task.description ?? "",
                    priority: task.priority,
                    scopeBucket: task.scopeBucket ?? "v01",
                    status: task.status,
                  })}
                  onSave={saveTask}
                  onEditingChange={setEditing}
                  onStartFocus={() => startFocus(task.id)}
                  onSetStatus={(status) => actions.setTaskStatus(task.id, status)}
                  onArchive={() => actions.archiveTask(task.id)}
                  focusDisabled={Boolean(activeFocusSession)}
                />
              ))}
            </div>
          </div>

          <aside className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
            <SideList title="Bloqueadas" tone="rose" icon={<Lock className="h-4 w-4" />} tasks={blockedTasks} projects={projectById} />
            <SideList title="Concluídas recentes" tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} tasks={doneTasks} projects={projectById} />
          </aside>
        </section>
      </div>
    </Shell>
  );
}

function TaskCard({
  task,
  index,
  project,
  dragging,
  editing,
  focusDisabled,
  onDragStart,
  onDragEnd,
  onDrop,
  onEdit,
  onSave,
  onEditingChange,
  onStartFocus,
  onSetStatus,
  onArchive,
}: {
  task: NucleoTask;
  index: number;
  project?: Project;
  dragging: boolean;
  editing: EditingTask | null;
  focusDisabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onEdit: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onEditingChange: (task: EditingTask | null) => void;
  onStartFocus: () => void;
  onSetStatus: (status: TaskStatus) => void;
  onArchive: () => void;
}) {
  const isEditing = editing?.id === task.id;
  const tone = task.priority === "high" ? "rose" : task.priority === "medium" ? "amber" : "cyan";
  const color = `var(--${tone})`;

  return (
    <article
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`rounded-2xl border bg-background/25 p-3 transition ${dragging ? "border-[color:var(--cyan)] opacity-60" : "border-border hover:border-[color:var(--cyan)]/40"}`}
    >
      {isEditing ? (
        <form onSubmit={onSave} className="grid gap-3">
          <input value={editing.title} onChange={(event) => onEditingChange({ ...editing, title: event.target.value })} className="atlas-input" />
          <input value={editing.description} onChange={(event) => onEditingChange({ ...editing, description: event.target.value })} className="atlas-input" />
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={editing.priority} onChange={(event) => onEditingChange({ ...editing, priority: event.target.value as TaskPriority })} className="atlas-input">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <select value={editing.scopeBucket} onChange={(event) => onEditingChange({ ...editing, scopeBucket: event.target.value as ScopeItem["bucket"] })} className="atlas-input">
              <option value="v01">V01</option>
              <option value="v02">V02</option>
              <option value="fora">Fora</option>
            </select>
            <select value={editing.status} onChange={(event) => onEditingChange({ ...editing, status: event.target.value as TaskStatus })} className="atlas-input">
              <option value="backlog">Backlog</option>
              <option value="ready">Pronta</option>
              <option value="blocked">Bloqueada</option>
              <option value="done">Concluída</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton label="Salvar tarefa" tone="emerald" type="submit"><Save className="h-4 w-4" /></IconButton>
            <IconButton label="Cancelar edição" tone="muted" onClick={() => onEditingChange(null)}><X className="h-4 w-4" /></IconButton>
          </div>
        </form>
      ) : (
        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface/60 font-mono text-xs text-muted-foreground">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="grid h-10 w-10 cursor-grab place-items-center rounded-xl border border-border bg-background/30 text-muted-foreground active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color, borderColor: `color-mix(in oklab, ${color} 34%, var(--border))` }}>
                {priorityLabel[task.priority]}
              </span>
              <span className="rounded-lg border border-border bg-background/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {statusLabel[task.status]}
              </span>
              {task.scopeBucket && (
                <span className="rounded-lg border border-border bg-background/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {bucketLabel[task.scopeBucket]}
                </span>
              )}
              {task.sourceType === "checkpoint" && (
                <span className="rounded-lg border border-[color:var(--violet)]/30 bg-[color:color-mix(in_oklab,var(--violet)_8%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--violet)]">
                  Checkpoint
                </span>
              )}
            </div>
            <h2 className="mt-2 text-base font-bold leading-snug">{task.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link to="/projeto/$id" params={{ id: task.projectId }} className="hover:text-[color:var(--cyan)]">{project?.name ?? "Projeto"}</Link>
              {task.description && <span>· {task.description}</span>}
            </div>
          </div>

          <div className="flex flex-wrap justify-start gap-2 md:justify-end">
            <button
              type="button"
              onClick={onStartFocus}
              disabled={focusDisabled}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[color:var(--cyan)]/35 bg-[color:color-mix(in_oklab,var(--cyan)_10%,transparent)] px-3 text-xs font-bold text-[color:var(--cyan)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              Foco
            </button>
            {task.status === "done" ? (
              <IconButton label="Reabrir tarefa" tone="amber" onClick={() => onSetStatus("ready")}><RotateCcw className="h-4 w-4" /></IconButton>
            ) : (
              <IconButton label="Concluir tarefa" tone="emerald" onClick={() => onSetStatus("done")}><CheckCircle2 className="h-4 w-4" /></IconButton>
            )}
            {task.status === "blocked" ? (
              <IconButton label="Liberar tarefa" tone="cyan" onClick={() => onSetStatus("ready")}><Circle className="h-4 w-4" /></IconButton>
            ) : (
              <IconButton label="Bloquear tarefa" tone="rose" onClick={() => onSetStatus("blocked")}><ShieldAlert className="h-4 w-4" /></IconButton>
            )}
            <IconButton label="Editar tarefa" tone="cyan" onClick={onEdit}><Pencil className="h-4 w-4" /></IconButton>
            <IconButton label="Arquivar tarefa" tone="rose" onClick={onArchive}><Archive className="h-4 w-4" /></IconButton>
          </div>
        </div>
      )}
    </article>
  );
}

function SideList({
  title,
  tone,
  icon,
  tasks,
  projects,
}: {
  title: string;
  tone: "rose" | "emerald";
  icon: ReactNode;
  tasks: NucleoTask[];
  projects: Map<string, Project>;
}) {
  const color = `var(--${tone})`;

  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
        {icon}{title}
      </header>
      <div className="divide-y divide-border px-4">
        {tasks.length === 0 && <div className="py-4 text-sm text-muted-foreground">Nada aqui.</div>}
        {tasks.map((task) => (
          <div key={task.id} className="py-3">
            <div className="text-sm font-semibold leading-snug">{task.title}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{projects.get(task.projectId)?.name}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "cyan" | "emerald" | "rose" | "amber" }) {
  const color = `var(--${tone})`;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
      {children}
    </label>
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
  tone: "cyan" | "emerald" | "amber" | "rose" | "muted";
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
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
