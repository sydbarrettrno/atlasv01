import { useEffect, useMemo, useState } from "react";
import {
  type Checkpoint,
  type Evidence,
  type FocusSession,
  type NucleoArchiveItem,
  type NucleoBlocker,
  type FocusSessionResult,
  type NucleoHistoryEvent,
  type NucleoState,
  type NucleoTask,
  type Project,
  type ProjectStatus,
  type RiskLevel,
  type ScopeItem,
  type TaskPriority,
  type TaskStatus,
  type TodayMission,
} from "@/lib/nucleo-data";
import {
  createHydratedDefaultState,
  loadNucleoState,
  resetNucleoState,
  saveNucleoState,
} from "@/lib/nucleo-storage";
import {
  calculateDashboardStats,
  calculateXPForFocusSession,
  calculateMissionProgress,
  createHistoryEvent,
  createVictoryFromCompletedAction,
  detectScopeDrift,
  getFocusSessionElapsedSeconds,
} from "@/lib/nucleo-rules";

type FinishFocusPayload = {
  result: FocusSessionResult;
  note: string;
  evidence: string;
};

type TodayMissionPayload = Partial<Omit<TodayMission, "completionChecklist">>;

type ProjectPayload = {
  name: string;
  currentState: string;
  destination: string;
  currentMission: string;
  nextAction: string;
  completionCriteria: string;
  risk: RiskLevel;
  status: ProjectStatus;
  color?: Project["color"];
};

type ProjectUpdatePayload = Partial<ProjectPayload>;

type ScopeItemPayload = {
  text: string;
  bucket: ScopeItem["bucket"];
};

type BlockerPayload = {
  title: string;
  detail?: string;
  owner?: string;
};

type TaskPayload = {
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  scopeBucket?: ScopeItem["bucket"];
  status?: TaskStatus;
};

type TaskUpdatePayload = Partial<Omit<TaskPayload, "projectId"> & {
  projectId: string;
  status: TaskStatus;
}>;

type Listener = (state: NucleoState) => void;

let cachedState: NucleoState = createHydratedDefaultState();
let hasLoadedPersistedState = false;
const listeners = new Set<Listener>();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

function nextProjectCode(projects: Project[]) {
  const next = projects.length + 1;
  return String(next).padStart(2, "0");
}

function territoryTone(color: Project["color"]): "cyan" | "violet" | "amber" | "emerald" | "rose" {
  if (color === "sky") return "cyan" as const;
  return color;
}

function formatFocusDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return `${hours}h${String(minutes).padStart(2, "0")}m`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getActiveSession(state: NucleoState) {
  return state.focusSessions.find((session) => session.status === "running" || session.status === "paused");
}

function addVictory(state: NucleoState, text: string) {
  return {
    ...state,
    victories: [createVictoryFromCompletedAction(text), ...state.victories].slice(0, 20),
  };
}

function addAlert(state: NucleoState, text: string) {
  return {
    ...state,
    alerts: [
      { id: createId("alert"), text, createdAt: new Date().toISOString() },
      ...state.alerts,
    ].slice(0, 10),
  };
}

function addXP(state: NucleoState, amount: number) {
  if (amount <= 0) return state;

  return {
    ...state,
    dashboardStats: {
      ...state.dashboardStats,
      xpCurrent: state.dashboardStats.xpCurrent + amount,
    },
  };
}

function addHistory(state: NucleoState, event: Omit<NucleoHistoryEvent, "id" | "createdAt">) {
  return {
    ...state,
    history: [createHistoryEvent(event), ...state.history].slice(0, 200),
  };
}

function addArchiveItem(state: NucleoState, item: Omit<NucleoArchiveItem, "id" | "archivedAt">) {
  const archiveItem: NucleoArchiveItem = {
    ...item,
    id: createId("archive"),
    archivedAt: new Date().toISOString(),
  };

  return addHistory({
    ...state,
    archiveItems: [archiveItem, ...state.archiveItems],
  }, {
    entityType: archiveItem.entityType,
    entityId: archiveItem.entityId,
    action: "archived",
    title: archiveItem.title,
    summary: archiveItem.reason,
    projectId: archiveItem.projectId,
  });
}

function recalculateState(state: NucleoState): NucleoState {
  const now = new Date().toISOString();
  const today = todayKey();
  const completedToday = state.focusSessions.filter(
    (session) => session.status === "completed" && (session.endedAt ?? session.startedAt).slice(0, 10) === today,
  );
  const focusSecondsToday = completedToday.reduce((sum, session) => sum + session.durationSeconds, 0);

  const projects = state.projects.map((project) => {
    if (project.checkpoints.length === 0) return project;
    if (!project.checkpoints.some((checkpoint) => checkpoint.xpAwarded)) return project;

    const done = project.checkpoints.filter((checkpoint) => checkpoint.done).length;
    const progress = Math.round((done / project.checkpoints.length) * 100);

    return {
      ...project,
      progress,
      scopePercent: project.isPrimary ? Math.max(project.scopePercent, progress) : project.scopePercent,
    };
  });

  const scopeTerritories = state.scopeTerritories.map((territory) => {
    const project = territory.projectId ? projects.find((item) => item.id === territory.projectId) : undefined;
    return project ? { ...territory, progress: project.progress } : territory;
  });

  const tasks = state.tasks.map((task) => {
    if (task.sourceType !== "checkpoint" || !task.sourceId || task.status === "archived") return task;

    const project = projects.find((item) => item.id === task.projectId);
    const checkpoint = project?.checkpoints.find((item) => item.id === task.sourceId);
    if (!checkpoint) return task;

    const status = checkpoint.done ? "done" as const : task.status === "done" ? "ready" as const : task.status;

    return {
      ...task,
      status,
      completedAt: checkpoint.done ? (task.completedAt ?? now) : undefined,
    };
  });

  const todayMission = {
    ...state.todayMission,
    progress: calculateMissionProgress(state),
  };

  const withDerived = {
    ...state,
    todayMission,
    projects,
    tasks,
    scopeTerritories,
    focusToday: {
      ...state.focusToday,
      duration: focusSecondsToday > 0 ? formatFocusDuration(focusSecondsToday) : state.focusToday.duration,
    },
    operationalCards: {
      ...state.operationalCards,
      recentVictories: state.victories.slice(0, 5),
    },
    lastUpdatedAt: now,
  };

  return {
    ...withDerived,
    dashboardStats: calculateDashboardStats(withDerived),
  };
}

function publish(nextState: NucleoState) {
  cachedState = recalculateState(nextState);
  saveNucleoState(cachedState);
  listeners.forEach((listener) => listener(cachedState));
}

function updateState(updater: (state: NucleoState) => NucleoState) {
  publish(updater(cachedState));
}

function hydrateCachedStateFromStorage() {
  if (hasLoadedPersistedState) return cachedState;

  cachedState = loadNucleoState();
  hasLoadedPersistedState = true;
  return cachedState;
}

export function useNucleoState() {
  const [state, setState] = useState<NucleoState>(cachedState);

  useEffect(() => {
    listeners.add(setState);

    const loadedState = hydrateCachedStateFromStorage();
    setState(loadedState);
    listeners.forEach((listener) => listener(loadedState));

    return () => {
      listeners.delete(setState);
    };
  }, []);

  const actions = useMemo(() => ({
    createProject(payload: ProjectPayload) {
      const name = payload.name.trim();
      if (!name) return "";

      const idBase = normalizeId(name) || "projeto";
      const id = cachedState.projects.some((project) => project.id === idBase) ? createId(idBase) : idBase;
      const now = new Date().toISOString();
      const color = payload.color ?? "cyan";
      const project: Project = {
        id,
        code: nextProjectCode(cachedState.projects),
        name,
        emoji: "◆",
        color,
        status: payload.status,
        risk: payload.risk,
        progress: 0,
        scopePercent: 0,
        currentState: payload.currentState.trim() || "Projeto recém-cadastrado.",
        destination: payload.destination.trim() || "Destino V01 a definir.",
        currentMission: payload.currentMission.trim() || "Definir missão atual",
        nextAction: payload.nextAction.trim() || "Definir próxima ação",
        completionCriteria: payload.completionCriteria.trim() || "Critério de conclusão a definir.",
        scope: [],
        dependencies: [],
        evidence: [],
        alerts: [],
        checkpoints: [],
      };
      const mission = {
        id: `mission-${id}-current`,
        projectId: id,
        title: project.currentMission,
        currentState: project.currentState,
        destination: project.destination,
        nextAction: project.nextAction,
        completionCriteria: project.completionCriteria,
        status: "planned" as const,
        progress: 0,
        order: cachedState.missions.length + 1,
        createdAt: now,
        updatedAt: now,
      };

      updateState((current) => addHistory({
        ...current,
        projects: [...current.projects, project],
        missions: [...current.missions, mission],
        scopeTerritories: [
          ...current.scopeTerritories,
          {
            id: `territory-${id}`,
            projectId: id,
            name: project.name,
            subtitle: "Novo território",
            progress: 0,
            status: "Em Progresso",
            tone: territoryTone(color),
            position: "south",
          },
        ],
      }, {
        entityType: "project",
        entityId: id,
        action: "created",
        title: `Projeto criado: ${project.name}`,
        projectId: id,
      }));

      return id;
    },

    updateProject(projectId: string, payload: ProjectUpdatePayload) {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        if (!project) return current;

        const nextProject = {
          ...project,
          ...payload,
          name: payload.name?.trim() || project.name,
          currentState: payload.currentState?.trim() || project.currentState,
          destination: payload.destination?.trim() || project.destination,
          currentMission: payload.currentMission?.trim() || project.currentMission,
          nextAction: payload.nextAction?.trim() || project.nextAction,
          completionCriteria: payload.completionCriteria?.trim() || project.completionCriteria,
        };

        return addHistory({
          ...current,
          projects: current.projects.map((item) => (item.id === projectId ? nextProject : item)),
          missions: current.missions.map((mission) => (
            mission.projectId === projectId
              ? {
                ...mission,
                title: nextProject.currentMission,
                currentState: nextProject.currentState,
                destination: nextProject.destination,
                nextAction: nextProject.nextAction,
                completionCriteria: nextProject.completionCriteria,
                updatedAt: new Date().toISOString(),
              }
              : mission
          )),
          scopeTerritories: current.scopeTerritories.map((territory) => (
            territory.projectId === projectId ? { ...territory, name: nextProject.name } : territory
          )),
        }, {
          entityType: "project",
          entityId: projectId,
          action: "updated",
          title: `Projeto atualizado: ${nextProject.name}`,
          projectId,
        });
      });
    },

    archiveProject(projectId: string, reason = "Arquivado pelo usuário") {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        if (!project) return current;

        return addArchiveItem({
          ...current,
          projects: current.projects.filter((item) => item.id !== projectId),
          scopeTerritories: current.scopeTerritories.filter((territory) => territory.projectId !== projectId),
          tasks: current.tasks.map((task) => (task.projectId === projectId ? { ...task, status: "archived" as const, archivedAt: new Date().toISOString() } : task)),
        }, {
          entityType: "project",
          entityId: projectId,
          title: project.name,
          projectId,
          reason,
          snapshot: project,
        });
      });
    },

    createProjectCheckpoint(projectId: string, label: string) {
      const text = label.trim();
      if (!text) return;

      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        if (!project) return current;

        const checkpointId = createId("checkpoint");
        const checkpoint: Checkpoint = { id: checkpointId, label: text, done: false };
        const task: NucleoTask = {
          id: `task-${projectId}-${checkpointId}`,
          projectId,
          missionId: `mission-${projectId}-current`,
          sourceType: "checkpoint",
          sourceId: checkpointId,
          title: text,
          status: "ready",
          priority: project.risk === "high" ? "high" : project.risk === "med" ? "medium" : "low",
          scopeBucket: "v01",
          order: project.checkpoints.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return addHistory({
          ...current,
          projects: current.projects.map((item) => (
            item.id === projectId ? { ...item, checkpoints: [...item.checkpoints, checkpoint] } : item
          )),
          tasks: [...current.tasks, task],
        }, {
          entityType: "checkpoint",
          entityId: checkpointId,
          action: "created",
          title: `Checkpoint criado: ${text}`,
          projectId,
        });
      });
    },

    updateProjectCheckpoint(projectId: string, checkpointId: string, label: string) {
      const text = label.trim();
      if (!text) return;

      updateState((current) => addHistory({
        ...current,
        projects: current.projects.map((project) => (
          project.id === projectId
            ? {
              ...project,
              checkpoints: project.checkpoints.map((checkpoint) => (
                checkpoint.id === checkpointId ? { ...checkpoint, label: text } : checkpoint
              )),
            }
            : project
        )),
        tasks: current.tasks.map((task) => (
          task.projectId === projectId && task.sourceType === "checkpoint" && task.sourceId === checkpointId
            ? { ...task, title: text, updatedAt: new Date().toISOString() }
            : task
        )),
      }, {
        entityType: "checkpoint",
        entityId: checkpointId,
        action: "updated",
        title: `Checkpoint editado: ${text}`,
        projectId,
      }));
    },

    archiveProjectCheckpoint(projectId: string, checkpointId: string) {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        const checkpoint = project?.checkpoints.find((item) => item.id === checkpointId);
        if (!project || !checkpoint) return current;

        return addArchiveItem({
          ...current,
          projects: current.projects.map((item) => (
            item.id === projectId
              ? { ...item, checkpoints: item.checkpoints.filter((entry) => entry.id !== checkpointId) }
              : item
          )),
          tasks: current.tasks.map((task) => (
            task.projectId === projectId && task.sourceId === checkpointId
              ? { ...task, status: "archived" as const, archivedAt: new Date().toISOString() }
              : task
          )),
        }, {
          entityType: "checkpoint",
          entityId: checkpointId,
          title: checkpoint.label,
          projectId,
          reason: "Checkpoint arquivado",
          snapshot: checkpoint,
        });
      });
    },

    createScopeItem(projectId: string, payload: ScopeItemPayload) {
      const text = payload.text.trim();
      if (!text) return;

      updateState((current) => {
        const scopeItem: ScopeItem = { id: createId("scope"), text, bucket: payload.bucket };

        return addHistory({
          ...current,
          projects: current.projects.map((project) => (
            project.id === projectId ? { ...project, scope: [...project.scope, scopeItem] } : project
          )),
        }, {
          entityType: "scopeItem",
          entityId: scopeItem.id,
          action: "created",
          title: `Item de escopo criado: ${text}`,
          projectId,
        });
      });
    },

    updateScopeItem(projectId: string, scopeItemId: string, text: string) {
      const cleanText = text.trim();
      if (!cleanText) return;

      updateState((current) => addHistory({
        ...current,
        projects: current.projects.map((project) => (
          project.id === projectId
            ? {
              ...project,
              scope: project.scope.map((item) => (item.id === scopeItemId ? { ...item, text: cleanText } : item)),
            }
            : project
        )),
      }, {
        entityType: "scopeItem",
        entityId: scopeItemId,
        action: "updated",
        title: `Escopo editado: ${cleanText}`,
        projectId,
      }));
    },

    moveScopeItem(projectId: string, scopeItemId: string, bucket: ScopeItem["bucket"]) {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        const scopeItem = project?.scope.find((item) => item.id === scopeItemId);
        if (!project || !scopeItem || scopeItem.bucket === bucket) return current;

        const movedToV02 = bucket === "v02" && scopeItem.bucket !== "v02";
        let updated = {
          ...current,
          projects: current.projects.map((item) => (
            item.id === projectId
              ? { ...item, scope: item.scope.map((scope) => (scope.id === scopeItemId ? { ...scope, bucket } : scope)) }
              : item
          )),
        };

        if (movedToV02) updated = addXP(updated, 25);

        return addHistory(updated, {
          entityType: "scopeItem",
          entityId: scopeItemId,
          action: "moved",
          title: `Escopo movido: ${scopeItem.text}`,
          summary: `Destino: ${bucket.toUpperCase()}`,
          projectId,
        });
      });
    },

    archiveScopeItem(projectId: string, scopeItemId: string) {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        const scopeItem = project?.scope.find((item) => item.id === scopeItemId);
        if (!project || !scopeItem) return current;

        return addArchiveItem({
          ...current,
          projects: current.projects.map((item) => (
            item.id === projectId ? { ...item, scope: item.scope.filter((scope) => scope.id !== scopeItemId) } : item
          )),
        }, {
          entityType: "scopeItem",
          entityId: scopeItemId,
          title: scopeItem.text,
          projectId,
          reason: "Item de escopo arquivado",
          snapshot: scopeItem,
        });
      });
    },

    archiveProjectEvidence(projectId: string, evidenceId: string) {
      updateState((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        const evidence = project?.evidence.find((item) => item.id === evidenceId);
        if (!project || !evidence) return current;

        return addArchiveItem({
          ...current,
          projects: current.projects.map((item) => (
            item.id === projectId
              ? { ...item, evidence: item.evidence.filter((entry) => entry.id !== evidenceId) }
              : item
          )),
        }, {
          entityType: "evidence",
          entityId: evidenceId,
          title: evidence.label,
          projectId,
          reason: "Evidência arquivada",
          snapshot: evidence,
        });
      });
    },

    createProjectBlocker(projectId: string, payload: BlockerPayload) {
      const title = payload.title.trim();
      if (!title) return;

      updateState((current) => {
        const blocker: NucleoBlocker = {
          id: createId("blocker"),
          projectId,
          title,
          detail: payload.detail?.trim() || undefined,
          owner: payload.owner?.trim() || undefined,
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return addHistory({
          ...current,
          blockers: [blocker, ...current.blockers],
        }, {
          entityType: "blocker",
          entityId: blocker.id,
          action: "created",
          title: `Bloqueio criado: ${title}`,
          projectId,
        });
      });
    },

    resolveProjectBlocker(blockerId: string) {
      updateState((current) => {
        const blocker = current.blockers.find((item) => item.id === blockerId);
        if (!blocker) return current;

        return addHistory({
          ...current,
          blockers: current.blockers.map((item) => (
            item.id === blockerId
              ? { ...item, status: "resolved" as const, resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : item
          )),
        }, {
          entityType: "blocker",
          entityId: blockerId,
          action: "completed",
          title: `Bloqueio resolvido: ${blocker.title}`,
          projectId: blocker.projectId,
        });
      });
    },

    archiveProjectBlocker(blockerId: string) {
      updateState((current) => {
        const blocker = current.blockers.find((item) => item.id === blockerId);
        if (!blocker) return current;

        return addArchiveItem({
          ...current,
          blockers: current.blockers.map((item) => (
            item.id === blockerId
              ? { ...item, status: "archived" as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : item
          )),
        }, {
          entityType: "blocker",
          entityId: blockerId,
          title: blocker.title,
          projectId: blocker.projectId,
          reason: "Bloqueio arquivado",
          snapshot: blocker,
        });
      });
    },

    restoreArchiveItem(archiveId: string) {
      updateState((current) => {
        const archiveItem = current.archiveItems.find((item) => item.id === archiveId);
        if (!archiveItem || archiveItem.restoredAt) return current;

        let restored: NucleoState = {
          ...current,
          archiveItems: current.archiveItems.map((item) => (
            item.id === archiveId ? { ...item, restoredAt: new Date().toISOString() } : item
          )),
        };

        if (archiveItem.entityType === "project" && archiveItem.snapshot) {
          const project = archiveItem.snapshot as Project;
          if (!restored.projects.some((item) => item.id === project.id)) {
            restored = {
              ...restored,
              projects: [...restored.projects, project],
              scopeTerritories: [
                ...restored.scopeTerritories,
                {
                  id: `territory-${project.id}`,
                  projectId: project.id,
                  name: project.name,
                  subtitle: "Restaurado do arquivo",
                  progress: project.progress,
                  status: "Em Progresso",
                  tone: territoryTone(project.color),
                  position: "south",
                },
              ],
            };
          }
        }

        if (archiveItem.entityType === "checkpoint" && archiveItem.projectId && archiveItem.snapshot) {
          const checkpoint = archiveItem.snapshot as Checkpoint;
          restored = {
            ...restored,
            projects: restored.projects.map((project) => (
              project.id === archiveItem.projectId && !project.checkpoints.some((item) => item.id === checkpoint.id)
                ? { ...project, checkpoints: [...project.checkpoints, checkpoint] }
                : project
            )),
          };
        }

        if (archiveItem.entityType === "scopeItem" && archiveItem.projectId && archiveItem.snapshot) {
          const scopeItem = archiveItem.snapshot as ScopeItem;
          restored = {
            ...restored,
            projects: restored.projects.map((project) => (
              project.id === archiveItem.projectId && !project.scope.some((item) => item.id === scopeItem.id)
                ? { ...project, scope: [...project.scope, scopeItem] }
                : project
            )),
          };
        }

        if (archiveItem.entityType === "evidence" && archiveItem.projectId && archiveItem.snapshot) {
          const evidence = archiveItem.snapshot as Evidence;
          restored = {
            ...restored,
            projects: restored.projects.map((project) => (
              project.id === archiveItem.projectId && !project.evidence.some((item) => item.id === evidence.id)
                ? { ...project, evidence: [evidence, ...project.evidence] }
                : project
            )),
          };
        }

        if (archiveItem.entityType === "task" && archiveItem.projectId && archiveItem.snapshot) {
          const task = archiveItem.snapshot as NucleoTask;
          restored = {
            ...restored,
            tasks: restored.tasks.some((item) => item.id === task.id)
              ? restored.tasks.map((item) => (
                item.id === task.id
                  ? { ...task, status: task.status === "archived" ? "ready" : task.status, archivedAt: undefined, updatedAt: new Date().toISOString() }
                  : item
              ))
              : [{ ...task, archivedAt: undefined, updatedAt: new Date().toISOString() }, ...restored.tasks],
          };
        }

        if (archiveItem.entityType === "blocker" && archiveItem.projectId && archiveItem.snapshot) {
          const blocker = archiveItem.snapshot as NucleoBlocker;
          restored = {
            ...restored,
            blockers: restored.blockers.some((item) => item.id === blocker.id)
              ? restored.blockers.map((item) => (
                item.id === blocker.id
                  ? { ...blocker, status: blocker.status === "archived" ? "open" : blocker.status, archivedAt: undefined, updatedAt: new Date().toISOString() }
                  : item
              ))
              : [{ ...blocker, archivedAt: undefined, updatedAt: new Date().toISOString() }, ...restored.blockers],
          };
        }

        return addHistory(restored, {
          entityType: archiveItem.entityType,
          entityId: archiveItem.entityId,
          action: "restored",
          title: `Restaurado: ${archiveItem.title}`,
          projectId: archiveItem.projectId,
        });
      });
    },

    deleteArchiveItem(archiveId: string) {
      updateState((current) => {
        const archiveItem = current.archiveItems.find((item) => item.id === archiveId);
        if (!archiveItem) return current;

        return addHistory({
          ...current,
          archiveItems: current.archiveItems.filter((item) => item.id !== archiveId),
        }, {
          entityType: archiveItem.entityType,
          entityId: archiveItem.entityId,
          action: "deleted",
          title: `Excluído definitivamente: ${archiveItem.title}`,
          projectId: archiveItem.projectId,
        });
      });
    },

    createTask(payload: TaskPayload) {
      const title = payload.title.trim();
      if (!title) return "";

      const now = new Date().toISOString();
      const project = cachedState.projects.find((item) => item.id === payload.projectId);
      if (!project) return "";

      const mission = cachedState.missions.find((item) => item.projectId === payload.projectId);
      const task: NucleoTask = {
        id: createId("task"),
        projectId: payload.projectId,
        missionId: mission?.id ?? `mission-${payload.projectId}-current`,
        sourceType: "manual",
        title,
        description: payload.description?.trim() || undefined,
        status: payload.status ?? "ready",
        priority: payload.priority,
        scopeBucket: payload.scopeBucket,
        order: cachedState.tasks.filter((item) => item.projectId === payload.projectId && item.status !== "archived").length + 1,
        createdAt: now,
        updatedAt: now,
      };

      updateState((current) => addHistory({
        ...current,
        tasks: [...current.tasks, task],
      }, {
        entityType: "task",
        entityId: task.id,
        action: "created",
        title: `Tarefa criada: ${task.title}`,
        projectId: task.projectId,
      }));

      return task.id;
    },

    updateTask(taskId: string, payload: TaskUpdatePayload) {
      updateState((current) => {
        const task = current.tasks.find((item) => item.id === taskId);
        if (!task) return current;

        const nextTask: NucleoTask = {
          ...task,
          ...payload,
          title: payload.title?.trim() || task.title,
          description: payload.description?.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };

        return addHistory({
          ...current,
          tasks: current.tasks.map((item) => (item.id === taskId ? nextTask : item)),
        }, {
          entityType: "task",
          entityId: taskId,
          action: "updated",
          title: `Tarefa atualizada: ${nextTask.title}`,
          projectId: nextTask.projectId,
        });
      });
    },

    setTaskStatus(taskId: string, status: TaskStatus) {
      updateState((current) => {
        const task = current.tasks.find((item) => item.id === taskId);
        if (!task || task.status === "archived") return current;

        const now = new Date().toISOString();
        const completing = status === "done" && task.status !== "done";
        const reopening = task.status === "done" && status !== "done";
        const projects = task.sourceType === "checkpoint" && task.sourceId
          ? current.projects.map((project) => (
            project.id === task.projectId
              ? {
                ...project,
                checkpoints: project.checkpoints.map((checkpoint) => (
                  checkpoint.id === task.sourceId
                    ? { ...checkpoint, done: status === "done", xpAwarded: checkpoint.xpAwarded || completing }
                    : checkpoint
                )),
              }
              : project
          ))
          : current.projects;

        let updated: NucleoState = {
          ...current,
          projects,
          tasks: current.tasks.map((item) => (
            item.id === taskId
              ? {
                ...item,
                status,
                completedAt: status === "done" ? (item.completedAt ?? now) : undefined,
                updatedAt: now,
              }
              : item
          )),
        };

        if (completing) {
          updated = addXP(addVictory(updated, `Tarefa concluída: ${task.title}`), 10);
        }

        return addHistory(updated, {
          entityType: "task",
          entityId: taskId,
          action: completing ? "completed" : reopening ? "reopened" : "updated",
          title: `${completing ? "Tarefa concluída" : reopening ? "Tarefa reaberta" : "Status atualizado"}: ${task.title}`,
          projectId: task.projectId,
        });
      });
    },

    archiveTask(taskId: string) {
      updateState((current) => {
        const task = current.tasks.find((item) => item.id === taskId);
        if (!task) return current;

        return addArchiveItem({
          ...current,
          tasks: current.tasks.map((item) => (
            item.id === taskId
              ? { ...item, status: "archived" as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : item
          )),
        }, {
          entityType: "task",
          entityId: taskId,
          title: task.title,
          projectId: task.projectId,
          reason: "Tarefa arquivada",
          snapshot: task,
        });
      });
    },

    reorderTasks(taskIds: string[]) {
      updateState((current) => {
        const orderById = new Map(taskIds.map((id, index) => [id, index + 1]));

        return addHistory({
          ...current,
          tasks: current.tasks.map((task) => (
            orderById.has(task.id)
              ? { ...task, order: orderById.get(task.id) ?? task.order, updatedAt: new Date().toISOString() }
              : task
          )),
        }, {
          entityType: "task",
          entityId: taskIds[0] ?? "task-order",
          action: "moved",
          title: "Fila de tarefas reordenada",
        });
      });
    },

    startFocusSession(taskId?: string) {
      updateState((current) => {
        if (getActiveSession(current)) return current;

        const now = new Date().toISOString();
        const task = taskId ? current.tasks.find((item) => item.id === taskId && item.status !== "archived") : undefined;
        const session: FocusSession = {
          id: createId("focus"),
          missionId: task?.missionId ?? current.todayMission.id,
          projectId: task?.projectId ?? current.todayMission.projectId,
          taskId: task?.id,
          startedAt: now,
          lastResumedAt: now,
          durationSeconds: 0,
          status: "running",
          note: "",
          evidence: "",
          xpEarned: 0,
        };

        return addHistory({
          ...current,
          focusSessions: [session, ...current.focusSessions],
          tasks: task
            ? current.tasks.map((item) => (
              item.id === task.id && item.status !== "done"
                ? { ...item, status: "in_focus" as const, updatedAt: now }
                : item
            ))
            : current.tasks,
        }, {
          entityType: "focusSession",
          entityId: session.id,
          action: "focus_started",
          title: task ? `Sessão de foco iniciada: ${task.title}` : "Sessão de foco iniciada",
          projectId: session.projectId,
        });
      });
    },

    pauseFocusSession() {
      updateState((current) => ({
        ...current,
        focusSessions: current.focusSessions.map((session) => {
          if (session.status !== "running") return session;

          return {
            ...session,
            durationSeconds: getFocusSessionElapsedSeconds(session),
            status: "paused",
            lastResumedAt: undefined,
          };
        }),
      }));
    },

    resumeFocusSession() {
      updateState((current) => ({
        ...current,
        focusSessions: current.focusSessions.map((session) => {
          if (session.status !== "paused") return session;

          return {
            ...session,
            status: "running",
            lastResumedAt: new Date().toISOString(),
          };
        }),
      }));
    },

    cancelFocusSession() {
      updateState((current) => {
        const activeSession = getActiveSession(current);
        const now = new Date().toISOString();

        return {
          ...current,
          focusSessions: current.focusSessions.map((session) => {
            if (session.status !== "running" && session.status !== "paused") return session;

            return {
              ...session,
              durationSeconds: getFocusSessionElapsedSeconds(session),
              endedAt: now,
              status: "cancelled",
            };
          }),
          tasks: activeSession?.taskId
            ? current.tasks.map((task) => (
              task.id === activeSession.taskId && task.status === "in_focus"
                ? { ...task, status: "ready" as const, updatedAt: now }
                : task
            ))
            : current.tasks,
        };
      });
    },

    finishFocusSession(payload: FinishFocusPayload) {
      updateState((current) => {
        let updated = current;
        let completedText: string | undefined;
        let completedSessionForXp: FocusSession | undefined;

        const focusSessions = current.focusSessions.map((session) => {
          if (session.status !== "running" && session.status !== "paused") return session;

          const completedSession: FocusSession = {
            ...session,
            durationSeconds: getFocusSessionElapsedSeconds(session),
            endedAt: new Date().toISOString(),
            status: "completed",
            result: payload.result,
            note: payload.note.trim(),
            evidence: payload.evidence.trim(),
            lastResumedAt: undefined,
            xpEarned: 0,
          };

          completedSession.xpEarned = calculateXPForFocusSession(completedSession);
          completedSessionForXp = completedSession;

          if (payload.result === "avancei" || payload.result === "concluido") {
            completedText = payload.result === "concluido"
              ? "Sessão de foco concluída"
              : "Sessão de foco avançou a missão";
          }

          return completedSession;
        });

        const xpEarned = completedSessionForXp?.xpEarned ?? 0;

        updated = addXP({ ...updated, focusSessions }, xpEarned);

        if (completedText) {
          updated = addVictory(updated, completedText);
        }

        if (payload.result === "desviei" || detectScopeDrift(`${payload.note} ${payload.evidence}`)) {
          updated = addAlert(updated, "Sessão registrou desvio de escopo. Recoloque a ideia no Portal V02 antes de abrir nova frente.");
        }

        if (completedSessionForXp?.taskId) {
          const task = current.tasks.find((item) => item.id === completedSessionForXp?.taskId);
          if (task) {
            const now = new Date().toISOString();
            const nextStatus: TaskStatus = payload.result === "concluido"
              ? "done"
              : payload.result === "travei"
                ? "blocked"
                : "ready";
            const completing = nextStatus === "done" && task.status !== "done";

            updated = {
              ...updated,
              tasks: updated.tasks.map((item) => (
                item.id === task.id
                  ? {
                    ...item,
                    status: nextStatus,
                    completedAt: nextStatus === "done" ? (item.completedAt ?? now) : undefined,
                    updatedAt: now,
                  }
                  : item
              )),
              projects: task.sourceType === "checkpoint" && task.sourceId
                ? updated.projects.map((project) => (
                  project.id === task.projectId
                    ? {
                      ...project,
                      checkpoints: project.checkpoints.map((checkpoint) => (
                        checkpoint.id === task.sourceId
                          ? { ...checkpoint, done: nextStatus === "done", xpAwarded: checkpoint.xpAwarded || completing }
                          : checkpoint
                      )),
                    }
                    : project
                ))
                : updated.projects,
            };

            if (completing) {
              updated = addXP(addVictory(updated, `Tarefa concluída: ${task.title}`), 10);
            }
          }
        }

        if (completedSessionForXp) {
          updated = addHistory(updated, {
            entityType: "focusSession",
            entityId: completedSessionForXp.id,
            action: "focus_completed",
            title: "Sessão de foco registrada",
            summary: payload.evidence.trim() || payload.note.trim() || payload.result,
            projectId: completedSessionForXp.projectId,
          });
        }

        return updated;
      });
    },

    toggleMissionChecklistItem(itemId: string) {
      updateState((current) => {
        let updated = current;
        let earnedXp = 0;
        let victoryText: string | undefined;

        const completionChecklist = current.todayMission.completionChecklist.map((item) => {
          if (item.id !== itemId) return item;

          const done = !item.done;
          if (done && !item.xpAwarded) {
            earnedXp += 15;
            victoryText = `Checkpoint concluído: ${item.text}`;
          }

          return {
            ...item,
            done,
            xpAwarded: item.xpAwarded || done,
          };
        });

        const allDone = completionChecklist.every((item) => item.done);
        const todayMission = {
          ...current.todayMission,
          completionChecklist,
          completedAt: allDone ? (current.todayMission.completedAt ?? new Date().toISOString()) : undefined,
        };

        updated = addXP({ ...updated, todayMission }, earnedXp);

        if (victoryText) {
          updated = addVictory(updated, victoryText);
        }

        if (allDone && !current.todayMission.completedAt) {
          updated = addXP(addVictory(updated, "Missão principal concluída"), 15);
        }

        if (victoryText) {
          updated = addHistory(updated, {
            entityType: "checkpoint",
            entityId: itemId,
            action: "completed",
            title: victoryText,
            projectId: current.todayMission.projectId,
          });
        }

        if (allDone && !current.todayMission.completedAt) {
          updated = addHistory(updated, {
            entityType: "mission",
            entityId: current.todayMission.id,
            action: "completed",
            title: "Missão principal concluída",
            projectId: current.todayMission.projectId,
          });
        }

        return updated;
      });
    },

    toggleJourneyStep(stepId: string) {
      updateState((current) => {
        const index = current.missionJourney.findIndex((step) => step.id === stepId);
        if (index === -1) return current;

        const target = current.missionJourney[index];
        let earnedXp = 0;
        let victoryText: string | undefined;

        const missionJourney = current.missionJourney.map((step, stepIndex) => {
          if (stepIndex === index && target.state === "active") {
            if (!step.xpAwarded) earnedXp += 15;
            victoryText = `Etapa concluída: ${step.label}`;
            return { ...step, state: "done" as const, xpAwarded: true };
          }

          if (stepIndex === index + 1 && target.state === "active" && step.state === "blocked") {
            return { ...step, state: "active" as const };
          }

          if (stepIndex === index && target.state === "blocked" && current.missionJourney[index - 1]?.state === "done") {
            return { ...step, state: "active" as const };
          }

          return step;
        });

        let updated = addXP({ ...current, missionJourney }, earnedXp);
        if (victoryText) updated = addVictory(updated, victoryText);
        if (victoryText) {
          updated = addHistory(updated, {
            entityType: "mission",
            entityId: stepId,
            action: "completed",
            title: victoryText,
            projectId: current.todayMission.projectId,
          });
        }

        return updated;
      });
    },

    markDoNotTodayAvoided(itemId: string) {
      updateState((current) => {
        const item = current.operationalCards.doNotToday.find((entry) => entry.id === itemId);
        if (!item) return current;

        const now = new Date().toISOString();
        const alreadyAvoided = item.status === "avoided";
        let updated = {
          ...current,
          operationalCards: {
            ...current.operationalCards,
            doNotToday: current.operationalCards.doNotToday.map((entry) => (
              entry.id === itemId ? { ...entry, status: "avoided" as const, lastMarkedAt: now } : entry
            )),
          },
          antiDriftLog: [
            {
              id: createId("drift"),
              itemId,
              text: item.text,
              status: "avoided" as const,
              createdAt: now,
              xpEarned: alreadyAvoided ? 0 : 10,
            },
            ...current.antiDriftLog,
          ],
        };

        if (!alreadyAvoided) {
          updated = addXP(addVictory(updated, `Desvio evitado: ${item.text}`), 10);
          updated = addHistory(updated, {
            entityType: "antiDrift",
            entityId: itemId,
            action: "drift_avoided",
            title: `Desvio evitado: ${item.text}`,
          });
        }

        return updated;
      });
    },

    markDoNotTodayViolated(itemId: string) {
      updateState((current) => {
        const item = current.operationalCards.doNotToday.find((entry) => entry.id === itemId);
        if (!item) return current;

        const now = new Date().toISOString();
        const updated = {
          ...current,
          operationalCards: {
            ...current.operationalCards,
            doNotToday: current.operationalCards.doNotToday.map((entry) => (
              entry.id === itemId ? { ...entry, status: "violated" as const, lastMarkedAt: now } : entry
            )),
          },
          antiDriftLog: [
            {
              id: createId("drift"),
              itemId,
              text: item.text,
              status: "violated" as const,
              createdAt: now,
              xpEarned: 0,
            },
            ...current.antiDriftLog,
          ],
        };

        return addHistory(addAlert(updated, `Desvio registrado: ${item.text}`), {
          entityType: "antiDrift",
          entityId: itemId,
          action: "drift_violated",
          title: `Desvio registrado: ${item.text}`,
        });
      });
    },

    addVictory(text: string) {
      updateState((current) => {
        const title = text.trim() || "Vitória registrada";

        return addHistory(addXP(addVictory(current, title), 10), {
          entityType: "victory",
          entityId: createId("victory"),
          action: "completed",
          title,
        });
      });
    },

    updateTodayMission(payload: TodayMissionPayload) {
      updateState((current) => ({
        ...current,
        todayMission: {
          ...current.todayMission,
          ...payload,
        },
      }));
    },

    toggleProjectCheckpoint(projectId: string, checkpointId: string) {
      updateState((current) => {
        let earnedXp = 0;
        let victoryText: string | undefined;

        const projects = current.projects.map((project) => {
          if (project.id !== projectId) return project;

          return {
            ...project,
            checkpoints: project.checkpoints.map((checkpoint) => {
              if (checkpoint.id !== checkpointId) return checkpoint;

              const done = !checkpoint.done;
              if (done && !checkpoint.xpAwarded) {
                earnedXp += 15;
                victoryText = `Checkpoint do projeto concluído: ${checkpoint.label}`;
              }

              return {
                ...checkpoint,
                done,
                xpAwarded: checkpoint.xpAwarded || done,
              };
            }),
          };
        });

        let updated = addXP({ ...current, projects }, earnedXp);
        if (victoryText) updated = addVictory(updated, victoryText);
        if (victoryText) {
          updated = addHistory(updated, {
            entityType: "checkpoint",
            entityId: checkpointId,
            action: "completed",
            title: victoryText,
            projectId,
          });
        }

        return updated;
      });
    },

    addProjectEvidence(projectId: string, label: string) {
      const text = label.trim();
      if (!text) return;

      updateState((current) => {
        const evidenceId = createId("evidence");

        return addHistory({
          ...current,
          projects: current.projects.map((project) => (
            project.id === projectId
              ? {
                ...project,
                evidence: [
                  { id: evidenceId, label: text, when: "Agora" },
                  ...project.evidence,
                ],
              }
              : project
          )),
        }, {
          entityType: "evidence",
          entityId: evidenceId,
          action: "evidence_added",
          title: text,
          projectId,
        });
      });
    },

    resetDemoData() {
      const cleanState = resetNucleoState();
      cachedState = cleanState;
      hasLoadedPersistedState = true;
      listeners.forEach((listener) => listener(cleanState));
    },
  }), []);

  return {
    state,
    actions,
    activeFocusSession: getActiveSession(state),
  };
}
