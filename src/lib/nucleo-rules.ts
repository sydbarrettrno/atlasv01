import type {
  FocusSession,
  NucleoEntityAction,
  NucleoEntityType,
  NucleoHistoryEvent,
  NucleoState,
  Victory,
} from "@/lib/nucleo-data";

export function calculateMissionProgress(state: NucleoState): number {
  const items = state.todayMission.completionChecklist;
  if (items.length === 0) return state.todayMission.progress;

  const done = items.filter((item) => item.done).length;
  return Math.round((done / items.length) * 100);
}

export function calculateJourneyProgress(state: NucleoState): number {
  const total = state.missionJourney.length;
  if (total === 0) return 0;

  const done = state.missionJourney.filter((step) => step.state === "done").length;
  return Math.round((done / total) * 100);
}

export function calculateTaskStats(state: NucleoState) {
  const activeTasks = state.tasks.filter((task) => task.status !== "archived");
  const done = activeTasks.filter((task) => task.status === "done").length;
  const blocked = activeTasks.filter((task) => task.status === "blocked").length;
  const ready = activeTasks.filter((task) => task.status === "ready" || task.status === "in_focus").length;
  const total = activeTasks.length;

  return {
    total,
    done,
    blocked,
    ready,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function calculateArchiveStats(state: NucleoState) {
  const archived = state.archiveItems.filter((item) => !item.restoredAt);

  return {
    total: archived.length,
    projects: archived.filter((item) => item.entityType === "project").length,
    tasks: archived.filter((item) => item.entityType === "task" || item.entityType === "checkpoint").length,
    evidence: archived.filter((item) => item.entityType === "evidence").length,
  };
}

export function getFocusSessionElapsedSeconds(session: FocusSession, now = Date.now()): number {
  if (session.status !== "running") {
    return session.durationSeconds;
  }

  const resumeAt = session.lastResumedAt ?? session.startedAt;
  const elapsed = Math.max(0, Math.floor((now - new Date(resumeAt).getTime()) / 1000));
  return session.durationSeconds + elapsed;
}

export function calculateXPForFocusSession(session: FocusSession): number {
  if (session.status !== "completed") return 0;

  let xp = 10;

  if (session.result === "avancei") xp += 20;
  if (session.evidence.trim().length > 0) xp += 15;

  return xp;
}

export function calculateDashboardStats(state: NucleoState) {
  const completedSessions = state.focusSessions.filter((session) => session.status === "completed");
  const completedByDate = new Set(
    completedSessions.map((session) => (session.endedAt ?? session.startedAt).slice(0, 10)),
  );

  let focusStreak = state.dashboardStats.focusStreak;
  if (completedByDate.size > 0) {
    focusStreak = 0;
    const cursor = new Date();
    for (let index = 0; index < 365; index += 1) {
      const key = cursor.toISOString().slice(0, 10);
      if (!completedByDate.has(key)) break;
      focusStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const journeyDone = state.missionJourney.filter((step) => step.state === "done").length;
  const checklistDone = state.todayMission.completionChecklist.filter((item) => item.done).length;
  const projectCheckpointDone = state.projects.reduce(
    (sum, project) => sum + project.checkpoints.filter((checkpoint) => checkpoint.done).length,
    0,
  );
  const projectCheckpointTotal = state.projects.reduce(
    (sum, project) => sum + project.checkpoints.length,
    0,
  );

  const checkpointsDone = journeyDone + checklistDone + projectCheckpointDone;
  const checkpointsTotal = state.missionJourney.length + state.todayMission.completionChecklist.length + projectCheckpointTotal;
  const xpCurrent = Math.max(0, Math.round(state.dashboardStats.xpCurrent));

  return {
    ...state.dashboardStats,
    focusStreak,
    xpCurrent,
    level: Math.floor(xpCurrent / 500) + 1,
    checkpointsDone,
    checkpointsTotal,
  };
}

export function createVictoryFromCompletedAction(action: string): Victory {
  return {
    id: `victory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: action,
    when: "Agora",
  };
}

export function createHistoryEvent({
  entityType,
  entityId,
  action,
  title,
  summary,
  projectId,
}: {
  entityType: NucleoEntityType;
  entityId: string;
  action: NucleoEntityAction;
  title: string;
  summary?: string;
  projectId?: string;
}): NucleoHistoryEvent {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityType,
    entityId,
    action,
    title,
    summary,
    projectId,
    createdAt: new Date().toISOString(),
  };
}

export function detectScopeDrift(actionText: string): boolean {
  const normalized = actionText.toLocaleLowerCase("pt-BR");
  const driftTerms = [
    "integração",
    "integracao",
    "api",
    "automação",
    "automacao",
    "novo módulo",
    "novo modulo",
    "refazer",
    "detalhes visuais",
    "login",
    "banco",
    "supabase",
  ];

  return driftTerms.some((term) => normalized.includes(term));
}
