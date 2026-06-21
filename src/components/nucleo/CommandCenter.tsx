import { Link } from "@tanstack/react-router";
import {
  Archive,
  Bell,
  FolderOpen,
  ListChecks,
  RotateCcw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNucleoState } from "@/hooks/useNucleoState";
import type {
  Project,
  ProjectStatus,
  RiskLevel,
  ScopeItem,
  TaskPriority,
} from "@/lib/nucleo-data";

export type CommandCenterSection = "project" | "task" | "system";

type CommandCenterProps = {
  open: boolean;
  requestedProjectId?: string;
  requestedSection: CommandCenterSection;
  onClose: () => void;
};

type AlertsPanelProps = {
  open: boolean;
  onClose: () => void;
};

type ProjectDraft = {
  name: string;
  currentState: string;
  destination: string;
  currentMission: string;
  nextAction: string;
  completionCriteria: string;
  status: ProjectStatus;
  risk: RiskLevel;
};

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  scopeBucket: ScopeItem["bucket"];
};

type Notice = {
  tone: "emerald" | "amber" | "rose";
  text: string;
};

const emptyProjectDraft: ProjectDraft = {
  name: "",
  currentState: "",
  destination: "",
  currentMission: "",
  nextAction: "",
  completionCriteria: "",
  status: "andamento",
  risk: "med",
};

const emptyTaskDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  scopeBucket: "v01",
};

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "andamento", label: "Em andamento" },
  { value: "planejamento", label: "Planejamento" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluido", label: "Concluido" },
];

const riskOptions: Array<{ value: RiskLevel; label: string }> = [
  { value: "low", label: "Baixo" },
  { value: "med", label: "Medio" },
  { value: "high", label: "Alto" },
];

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const scopeOptions: Array<{ value: ScopeItem["bucket"]; label: string }> = [
  { value: "v01", label: "V01" },
  { value: "v02", label: "V02" },
  { value: "fora", label: "Fora do escopo" },
];

function projectToDraft(project?: Project): ProjectDraft {
  if (!project) return emptyProjectDraft;

  return {
    name: project.name,
    currentState: project.currentState,
    destination: project.destination,
    currentMission: project.currentMission,
    nextAction: project.nextAction,
    completionCriteria: project.completionCriteria,
    status: project.status,
    risk: project.risk,
  };
}

export function CommandCenter({
  open,
  requestedProjectId,
  requestedSection,
  onClose,
}: CommandCenterProps) {
  const { state, actions } = useNucleoState();
  const [section, setSection] = useState<CommandCenterSection>(requestedSection);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [victoryText, setVictoryText] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedProject = state.projects.find((project) => project.id === selectedProjectId);
  const canSaveProject = Boolean(selectedProject && projectDraft.name.trim());
  const canCreateTask = Boolean(selectedProject && taskDraft.title.trim());

  useEffect(() => {
    if (!open) return;

    const nextProjectId = requestedProjectId && state.projects.some((project) => project.id === requestedProjectId)
      ? requestedProjectId
      : state.projects[0]?.id ?? "";

    setSection(requestedSection);
    setSelectedProjectId(nextProjectId);
    setProjectDraft(projectToDraft(state.projects.find((project) => project.id === nextProjectId)));
    setTaskDraft(emptyTaskDraft);
    setNotice(null);
  }, [open, requestedProjectId, requestedSection, state.projects]);

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => {
      setNotice((current) => (current?.text === nextNotice.text ? null : current));
    }, 3200);
  }

  function selectProject(projectId: string) {
    const project = state.projects.find((item) => item.id === projectId);
    setSelectedProjectId(projectId);
    setProjectDraft(projectToDraft(project));
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !canSaveProject) {
      showNotice({ tone: "amber", text: "Selecione um projeto antes de salvar." });
      return;
    }

    actions.updateProject(selectedProject.id, projectDraft);
    showNotice({ tone: "emerald", text: "Projeto modificado e salvo no navegador." });
  }

  function archiveProject() {
    if (!selectedProject) {
      showNotice({ tone: "amber", text: "Selecione um projeto antes de arquivar." });
      return;
    }

    const confirmed = window.confirm(`Arquivar o projeto "${selectedProject.name}"? Ele podera ser restaurado no Arquivo.`);
    if (!confirmed) return;

    const nextProject = state.projects.find((project) => project.id !== selectedProject.id);
    actions.archiveProject(selectedProject.id);
    setSelectedProjectId(nextProject?.id ?? "");
    setProjectDraft(projectToDraft(nextProject));
    showNotice({ tone: "amber", text: "Projeto arquivado." });
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !canCreateTask) {
      showNotice({ tone: "amber", text: "Informe uma atividade concreta antes de criar." });
      return;
    }

    actions.createTask({
      projectId: selectedProject.id,
      title: taskDraft.title,
      description: taskDraft.description,
      priority: taskDraft.priority,
      scopeBucket: taskDraft.scopeBucket,
      status: "ready",
    });
    setTaskDraft(emptyTaskDraft);
    showNotice({ tone: "emerald", text: "Nova atividade criada no Fluxo." });
  }

  function addVictory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = victoryText.trim();
    if (!text) {
      showNotice({ tone: "amber", text: "Escreva a vitoria antes de registrar." });
      return;
    }

    actions.addVictory(text);
    setVictoryText("");
    showNotice({ tone: "emerald", text: "Vitoria registrada." });
  }

  function resetProcesses() {
    const confirmed = window.confirm("Reiniciar processos e voltar aos dados iniciais? Seus ajustes locais serao substituidos pela base V01.");
    if (!confirmed) return;

    actions.resetDemoData();
    setNotice({ tone: "amber", text: "Sistema reiniciado com a base V01." });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-background/70 p-3 backdrop-blur-sm md:p-5">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar centro de controle" onClick={onClose} />
      <aside className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)] md:max-h-[calc(100vh-2.5rem)]">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--cyan)]">
              <SlidersHorizontal className="h-4 w-4" />
              Centro de Controle
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold">Modificar, criar, arquivar e reiniciar.</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/30 text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid gap-3 self-start">
            <Field label="Projeto ativo">
              <select value={selectedProjectId} onChange={(event) => selectProject(event.target.value)} className="atlas-input">
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </Field>

            <nav className="grid gap-2">
              <SectionButton active={section === "project"} icon={<FolderOpen className="h-4 w-4" />} onClick={() => setSection("project")}>
                Modificar projeto
              </SectionButton>
              <SectionButton active={section === "task"} icon={<ListChecks className="h-4 w-4" />} onClick={() => setSection("task")}>
                Nova atividade
              </SectionButton>
              <SectionButton active={section === "system"} icon={<RotateCcw className="h-4 w-4" />} onClick={() => setSection("system")}>
                Sistema local
              </SectionButton>
            </nav>

            <div className="rounded-2xl border border-border bg-background/25 p-3 text-xs leading-relaxed text-muted-foreground">
              Tudo aqui continua local no navegador. Nada de backend, login ou API externa.
            </div>
          </div>

          <div className="min-w-0">
            {section === "project" && (
              <form onSubmit={saveProject} className="grid gap-4">
                <PanelTitle icon={<FolderOpen className="h-4 w-4" />} title="Modificar projeto" subtitle="Edite missao, proxima acao, risco, status e escopo narrativo." />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nome">
                    <input value={projectDraft.name} onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))} className="atlas-input" />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Status">
                      <select value={projectDraft.status} onChange={(event) => setProjectDraft((current) => ({ ...current, status: event.target.value as ProjectStatus }))} className="atlas-input">
                        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Risco">
                      <select value={projectDraft.risk} onChange={(event) => setProjectDraft((current) => ({ ...current, risk: event.target.value as RiskLevel }))} className="atlas-input">
                        {riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Estado atual">
                    <textarea value={projectDraft.currentState} onChange={(event) => setProjectDraft((current) => ({ ...current, currentState: event.target.value }))} className="atlas-input min-h-24 resize-none" />
                  </Field>
                  <Field label="Destino V01">
                    <textarea value={projectDraft.destination} onChange={(event) => setProjectDraft((current) => ({ ...current, destination: event.target.value }))} className="atlas-input min-h-24 resize-none" />
                  </Field>
                  <Field label="Missao atual">
                    <input value={projectDraft.currentMission} onChange={(event) => setProjectDraft((current) => ({ ...current, currentMission: event.target.value }))} className="atlas-input" />
                  </Field>
                  <Field label="Proxima acao">
                    <input value={projectDraft.nextAction} onChange={(event) => setProjectDraft((current) => ({ ...current, nextAction: event.target.value }))} className="atlas-input" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Criterio de conclusao">
                      <input value={projectDraft.completionCriteria} onChange={(event) => setProjectDraft((current) => ({ ...current, completionCriteria: event.target.value }))} className="atlas-input" />
                    </Field>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={!canSaveProject} className="atlas-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    Salvar modificacoes
                  </button>
                  {selectedProject && (
                    <Link to="/projeto/$id" params={{ id: selectedProject.id }} onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--cyan)]/35 bg-[color:color-mix(in_oklab,var(--cyan)_10%,transparent)] px-4 text-sm font-bold text-[color:var(--cyan)]">
                      <FolderOpen className="h-4 w-4" />
                      Abrir detalhe
                    </Link>
                  )}
                  <button type="button" onClick={archiveProject} disabled={!selectedProject} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--rose)]/35 bg-[color:color-mix(in_oklab,var(--rose)_10%,transparent)] px-4 text-sm font-bold text-[color:var(--rose)] disabled:cursor-not-allowed disabled:opacity-50">
                    <Archive className="h-4 w-4" />
                    Arquivar
                  </button>
                </div>
              </form>
            )}

            {section === "task" && (
              <form onSubmit={createTask} className="grid gap-4">
                <PanelTitle icon={<ListChecks className="h-4 w-4" />} title="Criar nova atividade" subtitle="Crie uma proxima acao real no Fluxo Operacional." />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Atividade">
                    <input value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: revisar escopo V01" className="atlas-input" />
                  </Field>
                  <Field label="Detalhe curto">
                    <input value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Contexto ou restricao" className="atlas-input" />
                  </Field>
                  <Field label="Prioridade">
                    <select value={taskDraft.priority} onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className="atlas-input">
                      {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Escopo">
                    <select value={taskDraft.scopeBucket} onChange={(event) => setTaskDraft((current) => ({ ...current, scopeBucket: event.target.value as ScopeItem["bucket"] }))} className="atlas-input">
                      {scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={!canCreateTask} className="atlas-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50">
                    <Target className="h-4 w-4" />
                    Criar atividade
                  </button>
                  <Link to="/fluxo" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/30 px-4 text-sm font-bold text-muted-foreground hover:text-foreground">
                    <ListChecks className="h-4 w-4" />
                    Abrir fluxo
                  </Link>
                </div>
              </form>
            )}

            {section === "system" && (
              <div className="grid gap-4">
                <PanelTitle icon={<RotateCcw className="h-4 w-4" />} title="Sistema local" subtitle="Reinicie processos, registre vitorias e acompanhe memoria local." />
                <form onSubmit={addVictory} className="rounded-2xl border border-border bg-background/25 p-4">
                  <Field label="Registrar vitoria recente">
                    <div className="flex gap-2">
                      <input value={victoryText} onChange={(event) => setVictoryText(event.target.value)} placeholder="Ex.: escopo V01 revisado" className="atlas-input min-w-0 flex-1" />
                      <button type="submit" className="atlas-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-[0.14em]">
                        <Sparkles className="h-4 w-4" />
                        Registrar
                      </button>
                    </div>
                  </Field>
                </form>
                <div className="rounded-2xl border border-[color:var(--rose)]/35 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-1 h-5 w-5 text-[color:var(--rose)]" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold">Reiniciar processos</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Volta a base local para o estado inicial V01. Use quando quiser limpar testes, tarefas e ajustes locais.
                      </p>
                      <button type="button" onClick={resetProcesses} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--rose)]/40 bg-background/30 px-4 text-sm font-bold text-[color:var(--rose)]">
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar base local
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {notice && <NoticeBanner tone={notice.tone}>{notice.text}</NoticeBanner>}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AlertsPanel({ open, onClose }: AlertsPanelProps) {
  const { state } = useNucleoState();
  const blockers = state.blockers.filter((blocker) => blocker.status !== "archived" && blocker.status !== "resolved").slice(0, 8);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-background/70 p-3 backdrop-blur-sm md:p-5">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar notificacoes" onClick={onClose} />
      <aside className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)] md:max-h-[calc(100vh-2.5rem)]">
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--amber)]">
              <Bell className="h-4 w-4" />
              Notificacoes
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold">Riscos, alertas e bloqueios.</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/30 text-muted-foreground hover:text-foreground" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="grid gap-4 overflow-y-auto p-4">
          <PanelList title="Alertas de desvio" empty="Nenhum alerta local agora.">
            {state.alerts.map((alert) => (
              <AlertItem key={alert.id} title={alert.text} tail={formatShortDate(alert.createdAt)} tone="rose" />
            ))}
          </PanelList>
          <PanelList title={state.riskRadar.headline} empty="Radar sem risco novo.">
            {state.riskRadar.items.map((item) => (
              <AlertItem key={item} title={item} tone="amber" />
            ))}
          </PanelList>
          <PanelList title="Bloqueios ativos" empty="Sem bloqueios ativos.">
            {blockers.map((blocker) => (
              <AlertItem key={blocker.id} title={blocker.title} subtitle={[blocker.owner, blocker.detail].filter(Boolean).join(" · ")} tone="cyan" />
            ))}
          </PanelList>
          <Link to="/arquivo" onClick={onClose} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[color:var(--cyan)]/35 bg-[color:color-mix(in_oklab,var(--cyan)_10%,transparent)] px-4 text-sm font-bold text-[color:var(--cyan)]">
            <Archive className="h-4 w-4" />
            Abrir arquivo e historico
          </Link>
        </div>
      </aside>
    </div>
  );
}

function PanelTitle({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/25 p-4">
      <div className="flex items-center gap-2 text-[color:var(--cyan)]">
        {icon}
        <h3 className="font-display text-xl font-bold">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SectionButton({ active, icon, onClick, children }: { active: boolean; icon: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-bold transition ${
        active
          ? "border-[color:var(--cyan)]/40 bg-[color:color-mix(in_oklab,var(--cyan)_12%,transparent)] text-foreground"
          : "border-border bg-background/25 text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
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

function NoticeBanner({ tone, children }: { tone: Notice["tone"]; children: ReactNode }) {
  const color = `var(--${tone})`;

  return (
    <div className="mt-4 rounded-xl border bg-background/25 px-3 py-2 text-sm font-semibold" style={{ color, borderColor: `color-mix(in oklab, ${color} 34%, var(--border))` }}>
      {children}
    </div>
  );
}

function PanelList({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="rounded-2xl border border-border bg-background/25">
      <header className="border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </header>
      <div className="grid gap-2 p-3">
        {hasChildren ? children : <div className="rounded-xl border border-border bg-background/25 p-3 text-sm text-muted-foreground">{empty}</div>}
      </div>
    </section>
  );
}

function AlertItem({ title, subtitle, tail, tone }: { title: string; subtitle?: string; tail?: string; tone: "rose" | "amber" | "cyan" }) {
  const color = `var(--${tone})`;

  return (
    <div className="rounded-xl border border-border bg-background/25 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-snug">{title}</div>
          {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {tail && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{tail}</span>}
      </div>
      <div className="mt-2 h-1 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
    </div>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
