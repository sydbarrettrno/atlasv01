import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Flag,
  Hourglass,
  Layers,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Shell } from "@/components/nucleo/Shell";
import { useNucleoState } from "@/hooks/useNucleoState";
import {
  projects,
  riskLabel,
  statusLabel,
  type NucleoBlocker,
  type Project,
  type ProjectStatus,
  type RiskLevel,
  type ScopeItem,
} from "@/lib/nucleo-data";

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

type ScopeBucketKey = ScopeItem["bucket"];
type Notice = { tone: "emerald" | "amber" | "rose"; text: string };

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

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "andamento", label: "Em andamento" },
  { value: "planejamento", label: "Planejamento" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluido", label: "Concluído" },
];

const riskOptions: Array<{ value: RiskLevel; label: string }> = [
  { value: "low", label: "Baixo" },
  { value: "med", label: "Médio" },
  { value: "high", label: "Alto" },
];

const bucketLabels: Record<ScopeBucketKey, string> = {
  v01: "V01",
  v02: "V02",
  fora: "Fora",
};

export const Route = createFileRoute("/projeto/$id")({
  loader: ({ params }) => ({ projectId: params.id }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const navigate = useNavigate();
  const { projectId } = Route.useLoaderData() as { projectId: string };
  const { state, actions } = useNucleoState();
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [evidenceText, setEvidenceText] = useState("");
  const [checkpointText, setCheckpointText] = useState("");
  const [editingCheckpoint, setEditingCheckpoint] = useState<{ id: string; label: string } | null>(null);
  const [scopeInputs, setScopeInputs] = useState<Record<ScopeBucketKey, string>>({ v01: "", v02: "", fora: "" });
  const [editingScope, setEditingScope] = useState<{ id: string; text: string } | null>(null);
  const [blockerTitle, setBlockerTitle] = useState("");
  const [blockerDetail, setBlockerDetail] = useState("");
  const [blockerOwner, setBlockerOwner] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const project = state.projects.find((item) => item.id === projectId) ?? projects.find((item) => item.id === projectId);
  const blockers = state.blockers.filter((blocker) => blocker.projectId === projectId && blocker.status !== "archived");

  useEffect(() => {
    if (!project) return;

    setProjectDraft({
      name: project.name,
      currentState: project.currentState,
      destination: project.destination,
      currentMission: project.currentMission,
      nextAction: project.nextAction,
      completionCriteria: project.completionCriteria,
      status: project.status,
      risk: project.risk,
    });
  }, [project]);

  if (!project) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-surface/60 p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Projeto não encontrado</h1>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--cyan)]">
            <ArrowLeft className="h-4 w-4" /> Voltar ao mapa
          </Link>
        </div>
      </Shell>
    );
  }

  const p = project;
  const c = `var(--${p.color})`;
  const v01 = p.scope.filter((scope) => scope.bucket === "v01");
  const v02 = p.scope.filter((scope) => scope.bucket === "v02");
  const fora = p.scope.filter((scope) => scope.bucket === "fora");
  const canSaveProject = Boolean(projectDraft.name.trim());

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => {
      setNotice((current) => (current?.text === nextNotice.text ? null : current));
    }, 3200);
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSaveProject) {
      showNotice({ tone: "amber", text: "O projeto precisa manter um nome." });
      return;
    }

    actions.updateProject(p.id, projectDraft);
    showNotice({ tone: "emerald", text: "Projeto atualizado." });
  }

  function archiveProject() {
    const confirmed = window.confirm(`Arquivar o projeto "${p.name}"? Ele poderá ser restaurado no Arquivo.`);
    if (!confirmed) return;

    actions.archiveProject(p.id);
    void navigate({ to: "/" });
  }

  function addCheckpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkpointText.trim()) {
      showNotice({ tone: "amber", text: "Digite o checkpoint antes de adicionar." });
      return;
    }

    actions.createProjectCheckpoint(p.id, checkpointText);
    setCheckpointText("");
    showNotice({ tone: "emerald", text: "Checkpoint criado." });
  }

  function saveCheckpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCheckpoint) return;
    if (!editingCheckpoint.label.trim()) {
      showNotice({ tone: "amber", text: "O checkpoint precisa manter um nome." });
      return;
    }

    actions.updateProjectCheckpoint(p.id, editingCheckpoint.id, editingCheckpoint.label);
    setEditingCheckpoint(null);
    showNotice({ tone: "emerald", text: "Checkpoint atualizado." });
  }

  function addScopeItem(bucket: ScopeBucketKey, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scopeInputs[bucket].trim()) {
      showNotice({ tone: "amber", text: "Digite o item de escopo antes de adicionar." });
      return;
    }

    actions.createScopeItem(p.id, { bucket, text: scopeInputs[bucket] });
    setScopeInputs((current) => ({ ...current, [bucket]: "" }));
    showNotice({ tone: "emerald", text: "Item de escopo criado." });
  }

  function saveScopeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingScope) return;
    if (!editingScope.text.trim()) {
      showNotice({ tone: "amber", text: "O item de escopo precisa manter uma descrição." });
      return;
    }

    actions.updateScopeItem(p.id, editingScope.id, editingScope.text);
    setEditingScope(null);
    showNotice({ tone: "emerald", text: "Item de escopo atualizado." });
  }

  function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evidenceText.trim()) {
      showNotice({ tone: "amber", text: "Digite uma evidência antes de registrar." });
      return;
    }

    actions.addProjectEvidence(p.id, evidenceText);
    setEvidenceText("");
    showNotice({ tone: "emerald", text: "Evidência registrada." });
  }

  function addBlocker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!blockerTitle.trim()) {
      showNotice({ tone: "amber", text: "Digite o bloqueio antes de registrar." });
      return;
    }

    actions.createProjectBlocker(p.id, {
      title: blockerTitle,
      detail: blockerDetail,
      owner: blockerOwner,
    });
    setBlockerTitle("");
    setBlockerDetail("");
    setBlockerOwner("");
    showNotice({ tone: "emerald", text: "Bloqueio registrado." });
  }

  function archiveCheckpoint(checkpointId: string, label: string) {
    const confirmed = window.confirm(`Arquivar o checkpoint "${label}"?`);
    if (!confirmed) return;

    actions.archiveProjectCheckpoint(p.id, checkpointId);
    showNotice({ tone: "amber", text: "Checkpoint arquivado." });
  }

  function archiveScopeItem(itemId: string, text: string) {
    const confirmed = window.confirm(`Arquivar o item "${text}"?`);
    if (!confirmed) return;

    actions.archiveScopeItem(p.id, itemId);
    showNotice({ tone: "amber", text: "Item de escopo arquivado." });
  }

  function archiveEvidence(evidenceId: string, label: string) {
    const confirmed = window.confirm(`Arquivar a evidência "${label}"?`);
    if (!confirmed) return;

    actions.archiveProjectEvidence(p.id, evidenceId);
    showNotice({ tone: "amber", text: "Evidência arquivada." });
  }

  function archiveBlocker(blockerId: string, title: string) {
    const confirmed = window.confirm(`Arquivar o bloqueio "${title}"?`);
    if (!confirmed) return;

    actions.archiveProjectBlocker(blockerId);
    showNotice({ tone: "amber", text: "Bloqueio arquivado." });
  }

  return (
    <Shell>
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Mapa Estratégico
        </Link>

        <header
          className="relative overflow-hidden rounded-3xl border border-border p-6 md:p-8"
          style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${c} 14%, transparent), oklch(0.18 0.04 260))` }}
        >
          <div className="absolute inset-0 bg-grid opacity-[0.07]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: c }} />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="font-mono text-xs text-muted-foreground">Projeto · {p.code}</div>
              <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-border bg-surface/60 px-2 py-1">{statusLabel[p.status]}</span>
                <span className="rounded-md px-2 py-1 font-semibold" style={{ background: `color-mix(in oklab, ${c} 16%, transparent)`, color: c }}>
                  Risco {riskLabel[p.risk]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl font-bold" style={{ color: c }}>{p.progress}%</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">progresso real</div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={<MapPin className="h-4 w-4" />} title="Estado atual" tone="cyan">{p.currentState}</InfoCard>
          <InfoCard icon={<Flag className="h-4 w-4" />} title="Destino V01" tone="violet">{p.destination}</InfoCard>
        </div>

        <section className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <MissionStep icon={<Target className="h-4 w-4" />} label="Missão atual" text={p.currentMission} />
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <MissionStep icon={<ArrowRight className="h-4 w-4" />} label="Próxima ação" text={p.nextAction} />
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
            <MissionStep icon={<CheckCircle2 className="h-4 w-4" />} label="Critério de conclusão" text={p.completionCriteria} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/70 p-5 shadow-[0_24px_80px_-52px_var(--cyan)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[color:var(--cyan)]">
              <Pencil className="h-4 w-4" />
              <h2 className="font-display text-lg font-bold">Comando do projeto</h2>
            </div>
            <button
              type="button"
              onClick={archiveProject}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[color:var(--rose)]/35 bg-[color:color-mix(in_oklab,var(--rose)_10%,transparent)] px-3 text-xs font-bold text-[color:var(--rose)] transition hover:bg-[color:color-mix(in_oklab,var(--rose)_16%,transparent)]"
            >
              <Archive className="h-3.5 w-3.5" />
              Arquivar
            </button>
          </div>

          <form onSubmit={saveProject} className="grid gap-4 lg:grid-cols-2">
            <Field label="Nome">
              <input value={projectDraft.name} onChange={(event) => setProjectDraft((draft) => ({ ...draft, name: event.target.value }))} className="atlas-input" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <select value={projectDraft.status} onChange={(event) => setProjectDraft((draft) => ({ ...draft, status: event.target.value as ProjectStatus }))} className="atlas-input">
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Risco">
                <select value={projectDraft.risk} onChange={(event) => setProjectDraft((draft) => ({ ...draft, risk: event.target.value as RiskLevel }))} className="atlas-input">
                  {riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Estado atual">
              <textarea value={projectDraft.currentState} onChange={(event) => setProjectDraft((draft) => ({ ...draft, currentState: event.target.value }))} className="atlas-input min-h-20 resize-none" />
            </Field>
            <Field label="Destino V01">
              <textarea value={projectDraft.destination} onChange={(event) => setProjectDraft((draft) => ({ ...draft, destination: event.target.value }))} className="atlas-input min-h-20 resize-none" />
            </Field>
            <Field label="Missão atual">
              <input value={projectDraft.currentMission} onChange={(event) => setProjectDraft((draft) => ({ ...draft, currentMission: event.target.value }))} className="atlas-input" />
            </Field>
            <Field label="Próxima ação">
              <input value={projectDraft.nextAction} onChange={(event) => setProjectDraft((draft) => ({ ...draft, nextAction: event.target.value }))} className="atlas-input" />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Critério de conclusão">
                <input value={projectDraft.completionCriteria} onChange={(event) => setProjectDraft((draft) => ({ ...draft, completionCriteria: event.target.value }))} className="atlas-input" />
              </Field>
            </div>
            <div className="lg:col-span-2">
              <button type="submit" disabled={!canSaveProject} className="atlas-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50">
                <Save className="h-4 w-4" />
                Salvar comando
              </button>
            </div>
          </form>
          {notice && <NoticeBanner tone={notice.tone}>{notice.text}</NoticeBanner>}
        </section>

        <section className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[color:var(--cyan)]">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="font-display text-lg font-bold">Checkpoints do projeto</h2>
            </div>
            <span className="rounded-lg border border-border bg-background/25 px-3 py-1 font-mono text-xs text-muted-foreground">
              {p.checkpoints.filter((checkpoint) => checkpoint.done).length}/{p.checkpoints.length}
            </span>
          </div>
          <form onSubmit={addCheckpoint} className="mb-4 flex gap-2">
            <input
              value={checkpointText}
              onChange={(event) => setCheckpointText(event.target.value)}
              placeholder="Novo checkpoint"
              className="atlas-input min-w-0 flex-1"
            />
            <IconButton label="Adicionar checkpoint" tone="cyan" type="submit">
              <Plus className="h-4 w-4" />
            </IconButton>
          </form>
          <div className="grid gap-2 md:grid-cols-2">
            {p.checkpoints.map((checkpoint) => (
              <div key={checkpoint.id} className="rounded-xl border border-border bg-background/25 p-3">
                {editingCheckpoint?.id === checkpoint.id ? (
                  <form onSubmit={saveCheckpoint} className="flex gap-2">
                    <input
                      value={editingCheckpoint.label}
                      onChange={(event) => setEditingCheckpoint({ ...editingCheckpoint, label: event.target.value })}
                      className="atlas-input min-w-0 flex-1"
                    />
                    <IconButton label="Salvar checkpoint" tone="emerald" type="submit"><Save className="h-4 w-4" /></IconButton>
                    <IconButton label="Cancelar edição" tone="muted" onClick={() => setEditingCheckpoint(null)}><X className="h-4 w-4" /></IconButton>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => actions.toggleProjectCheckpoint(p.id, checkpoint.id)}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
                        checkpoint.done
                          ? "border-[color:var(--emerald)]/40 text-[color:var(--emerald)]"
                          : "border-border text-muted-foreground hover:border-[color:var(--cyan)]/40 hover:text-[color:var(--cyan)]"
                      }`}
                      aria-label={checkpoint.done ? "Reabrir checkpoint" : "Concluir checkpoint"}
                    >
                      {checkpoint.done ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <span className={`min-w-0 flex-1 text-sm ${checkpoint.done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{checkpoint.label}</span>
                    <IconButton label="Editar checkpoint" tone="cyan" onClick={() => setEditingCheckpoint({ id: checkpoint.id, label: checkpoint.label })}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Arquivar checkpoint" tone="rose" onClick={() => archiveCheckpoint(checkpoint.id, checkpoint.label)}>
                      <Archive className="h-4 w-4" />
                    </IconButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <ScopeBucket
            title="Escopo V01"
            tone="cyan"
            icon={<Target className="h-4 w-4" />}
            bucket="v01"
            items={v01}
            inputValue={scopeInputs.v01}
            editingScope={editingScope}
            onInputChange={(value) => setScopeInputs((current) => ({ ...current, v01: value }))}
            onAdd={(event) => addScopeItem("v01", event)}
            onEdit={setEditingScope}
            onSave={saveScopeItem}
            onMove={(itemId, bucket) => actions.moveScopeItem(p.id, itemId, bucket)}
            onArchive={(itemId) => archiveScopeItem(itemId, p.scope.find((item) => item.id === itemId)?.text ?? "item")}
          />
          <ScopeBucket
            title="V02 - Portal"
            tone="violet"
            icon={<Layers className="h-4 w-4" />}
            bucket="v02"
            items={v02}
            inputValue={scopeInputs.v02}
            editingScope={editingScope}
            onInputChange={(value) => setScopeInputs((current) => ({ ...current, v02: value }))}
            onAdd={(event) => addScopeItem("v02", event)}
            onEdit={setEditingScope}
            onSave={saveScopeItem}
            onMove={(itemId, bucket) => actions.moveScopeItem(p.id, itemId, bucket)}
            onArchive={(itemId) => archiveScopeItem(itemId, p.scope.find((item) => item.id === itemId)?.text ?? "item")}
          />
          <ScopeBucket
            title="Fora do Escopo"
            tone="rose"
            icon={<Ban className="h-4 w-4" />}
            bucket="fora"
            items={fora}
            inputValue={scopeInputs.fora}
            editingScope={editingScope}
            onInputChange={(value) => setScopeInputs((current) => ({ ...current, fora: value }))}
            onAdd={(event) => addScopeItem("fora", event)}
            onEdit={setEditingScope}
            onSave={saveScopeItem}
            onMove={(itemId, bucket) => actions.moveScopeItem(p.id, itemId, bucket)}
            onArchive={(itemId) => archiveScopeItem(itemId, p.scope.find((item) => item.id === itemId)?.text ?? "item")}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <BlockerPanel
            blockers={blockers}
            title={blockerTitle}
            detail={blockerDetail}
            owner={blockerOwner}
            onTitleChange={setBlockerTitle}
            onDetailChange={setBlockerDetail}
            onOwnerChange={setBlockerOwner}
            onSubmit={addBlocker}
            onResolve={(blockerId) => actions.resolveProjectBlocker(blockerId)}
            onArchive={(blockerId) => archiveBlocker(blockerId, blockers.find((blocker) => blocker.id === blockerId)?.title ?? "bloqueio")}
          />
          <EvidencePanel
            evidence={p.evidence}
            value={evidenceText}
            onChange={setEvidenceText}
            onSubmit={addEvidence}
            onArchive={(evidenceId) => archiveEvidence(evidenceId, p.evidence.find((evidence) => evidence.id === evidenceId)?.label ?? "evidência")}
          />
          <PanelList
            title="Alertas de desvio"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="rose"
            empty="Tudo sob controle."
            items={p.alerts.map((alert, index) => ({ key: String(index), primary: alert }))}
          />
        </div>
      </div>
    </Shell>
  );
}

function InfoCard({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: "cyan" | "violet"; children: ReactNode }) {
  const c = `var(--${tone})`;
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c }}>
        {icon}{title}
      </div>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function MissionStep({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-[color:var(--cyan)]">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold leading-snug">{text}</div>
      </div>
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

function NoticeBanner({ tone, children }: { tone: Notice["tone"]; children: ReactNode }) {
  const color = `var(--${tone})`;

  return (
    <div className="mt-3 rounded-xl border bg-background/25 px-3 py-2 text-sm font-semibold" style={{ color, borderColor: `color-mix(in oklab, ${color} 34%, var(--border))` }}>
      {children}
    </div>
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
  tone: "cyan" | "violet" | "emerald" | "rose" | "muted";
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

function ScopeBucket({
  title,
  tone,
  icon,
  bucket,
  items,
  inputValue,
  editingScope,
  onInputChange,
  onAdd,
  onEdit,
  onSave,
  onMove,
  onArchive,
}: {
  title: string;
  tone: "cyan" | "violet" | "rose";
  icon: ReactNode;
  bucket: ScopeBucketKey;
  items: ScopeItem[];
  inputValue: string;
  editingScope: { id: string; text: string } | null;
  onInputChange: (value: string) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (value: { id: string; text: string } | null) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onMove: (itemId: string, bucket: ScopeBucketKey) => void;
  onArchive: (itemId: string) => void;
}) {
  const c = `var(--${tone})`;
  const moveTargets = (["v01", "v02", "fora"] as ScopeBucketKey[]).filter((target) => target !== bucket);

  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
          {icon}{title}
        </div>
        <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
      </header>
      <form onSubmit={onAdd} className="flex gap-2 border-b border-border p-3">
        <input value={inputValue} onChange={(event) => onInputChange(event.target.value)} placeholder="Adicionar item" className="atlas-input min-w-0 flex-1" />
        <IconButton label={`Adicionar em ${title}`} tone={tone} type="submit"><Plus className="h-4 w-4" /></IconButton>
      </form>
      <ul className="divide-y divide-border">
        {items.length === 0 && <li className="px-4 py-4 text-sm text-muted-foreground">Vazio.</li>}
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3">
            {editingScope?.id === item.id ? (
              <form onSubmit={onSave} className="flex gap-2">
                <input value={editingScope.text} onChange={(event) => onEdit({ ...editingScope, text: event.target.value })} className="atlas-input min-w-0 flex-1" />
                <IconButton label="Salvar item" tone="emerald" type="submit"><Save className="h-4 w-4" /></IconButton>
                <IconButton label="Cancelar edição" tone="muted" onClick={() => onEdit(null)}><X className="h-4 w-4" /></IconButton>
              </form>
            ) : (
              <div className="grid gap-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                  <span className="min-w-0 leading-snug">{item.text}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => onEdit({ id: item.id, text: item.text })} className="rounded-lg border border-border bg-background/25 px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                    Editar
                  </button>
                  {moveTargets.map((target) => (
                    <button key={target} type="button" onClick={() => onMove(item.id, target)} className="rounded-lg border border-border bg-background/25 px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                      {bucketLabels[target]}
                    </button>
                  ))}
                  <button type="button" onClick={() => onArchive(item.id)} className="rounded-lg border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--rose)]">
                    Arquivar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BlockerPanel({
  blockers,
  title,
  detail,
  owner,
  onTitleChange,
  onDetailChange,
  onOwnerChange,
  onSubmit,
  onResolve,
  onArchive,
}: {
  blockers: NucleoBlocker[];
  title: string;
  detail: string;
  owner: string;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResolve: (blockerId: string) => void;
  onArchive: (blockerId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--amber)]">
        <Hourglass className="h-4 w-4" />Bloqueios
      </header>
      <form onSubmit={onSubmit} className="grid gap-2 border-b border-border p-4">
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Novo bloqueio" className="atlas-input" />
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={owner} onChange={(event) => onOwnerChange(event.target.value)} placeholder="Responsavel / terceiro" className="atlas-input" />
          <input value={detail} onChange={(event) => onDetailChange(event.target.value)} placeholder="Detalhe curto" className="atlas-input" />
        </div>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--amber)]/35 bg-[color:color-mix(in_oklab,var(--amber)_10%,transparent)] px-3 text-xs font-bold text-[color:var(--amber)]">
          <Plus className="h-4 w-4" />
          Registrar bloqueio
        </button>
      </form>
      <ul className="divide-y divide-border px-4">
        {blockers.length === 0 && <li className="py-4 text-sm text-muted-foreground">Sem bloqueios registrados.</li>}
        {blockers.map((blocker) => (
          <li key={blocker.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{blocker.title}</div>
                {(blocker.owner || blocker.detail) && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {[blocker.owner, blocker.detail].filter(Boolean).join(" · ")}
                  </div>
                )}
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--amber)]">{blocker.status}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {blocker.status !== "resolved" && (
                <button type="button" onClick={() => onResolve(blocker.id)} className="rounded-lg border border-[color:var(--emerald)]/30 bg-[color:color-mix(in_oklab,var(--emerald)_8%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--emerald)]">
                  Resolver
                </button>
              )}
              <button type="button" onClick={() => onArchive(blocker.id)} className="rounded-lg border border-[color:var(--rose)]/30 bg-[color:color-mix(in_oklab,var(--rose)_8%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--rose)]">
                Arquivar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidencePanel({
  evidence,
  value,
  onChange,
  onSubmit,
  onArchive,
}: {
  evidence: Project["evidence"];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onArchive: (evidenceId: string) => void;
}) {
  const c = "var(--emerald)";

  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        <ShieldCheck className="h-4 w-4" />Evidências
      </header>
      <form onSubmit={onSubmit} className="border-b border-border p-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Registrar evidência
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Ex.: escopo V01 revisado"
              className="atlas-input min-w-0 flex-1"
            />
            <IconButton label="Registrar evidência" tone="emerald" type="submit"><Plus className="h-4 w-4" /></IconButton>
          </div>
        </label>
      </form>
      <ul className="divide-y divide-border px-4">
        {evidence.length === 0 && <li className="py-4 text-sm text-muted-foreground">Sem evidências registradas.</li>}
        {evidence.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.label}</div>
              <span className="font-mono text-[11px] text-muted-foreground">{item.when}</span>
            </div>
            <IconButton label="Arquivar evidência" tone="rose" onClick={() => onArchive(item.id)}><Archive className="h-4 w-4" /></IconButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PanelList({
  title,
  icon,
  tone,
  items,
  empty,
}: {
  title: string;
  icon: ReactNode;
  tone: "amber" | "emerald" | "rose";
  items: { key: string; primary: string; secondary?: string; tail?: string }[];
  empty: string;
}) {
  const c = `var(--${tone})`;
  return (
    <section className="rounded-2xl border border-border bg-surface/60">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: c }}>
        {icon}{title}
      </header>
      <ul className="divide-y divide-border px-4">
        {items.length === 0 && <li className="py-4 text-sm text-muted-foreground">{empty}</li>}
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.primary}</div>
              {item.secondary && <div className="truncate text-[11px] text-muted-foreground">{item.secondary}</div>}
            </div>
            {item.tail && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.tail}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
