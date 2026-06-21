import { useEffect, useMemo, useState } from "react";
import {
  type FocusSession,
  type FocusSessionResult,
  type NucleoState,
  type TodayMission,
} from "@/lib/nucleo-data";
import { loadNucleoState, resetNucleoState, saveNucleoState } from "@/lib/nucleo-storage";
import {
  calculateDashboardStats,
  calculateXPForFocusSession,
  calculateMissionProgress,
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

type Listener = (state: NucleoState) => void;

let cachedState: NucleoState = loadNucleoState();
const listeners = new Set<Listener>();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function recalculateState(state: NucleoState): NucleoState {
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

  const todayMission = {
    ...state.todayMission,
    progress: calculateMissionProgress(state),
  };

  const withDerived = {
    ...state,
    todayMission,
    projects,
    scopeTerritories,
    focusToday: {
      ...state.focusToday,
      duration: focusSecondsToday > 0 ? formatFocusDuration(focusSecondsToday) : state.focusToday.duration,
    },
    operationalCards: {
      ...state.operationalCards,
      recentVictories: state.victories.slice(0, 5),
    },
    lastUpdatedAt: new Date().toISOString(),
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

export function useNucleoState() {
  const [state, setState] = useState<NucleoState>(cachedState);

  useEffect(() => {
    const loadedState = loadNucleoState();
    cachedState = loadedState;
    setState(loadedState);

    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const actions = useMemo(() => ({
    startFocusSession() {
      updateState((current) => {
        if (getActiveSession(current)) return current;

        const now = new Date().toISOString();
        const session: FocusSession = {
          id: createId("focus"),
          missionId: current.todayMission.id,
          projectId: current.todayMission.projectId,
          startedAt: now,
          lastResumedAt: now,
          durationSeconds: 0,
          status: "running",
          note: "",
          evidence: "",
          xpEarned: 0,
        };

        return {
          ...current,
          focusSessions: [session, ...current.focusSessions],
        };
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
      updateState((current) => ({
        ...current,
        focusSessions: current.focusSessions.map((session) => {
          if (session.status !== "running" && session.status !== "paused") return session;

          return {
            ...session,
            durationSeconds: getFocusSessionElapsedSeconds(session),
            endedAt: new Date().toISOString(),
            status: "cancelled",
          };
        }),
      }));
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

        return addAlert(updated, `Desvio registrado: ${item.text}`);
      });
    },

    addVictory(text: string) {
      updateState((current) => addXP(addVictory(current, text.trim() || "Vitória registrada"), 10));
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

        return updated;
      });
    },

    addProjectEvidence(projectId: string, label: string) {
      const text = label.trim();
      if (!text) return;

      updateState((current) => ({
        ...current,
        projects: current.projects.map((project) => (
          project.id === projectId
            ? {
              ...project,
              evidence: [
                { id: createId("evidence"), label: text, when: "Agora" },
                ...project.evidence,
              ],
            }
            : project
        )),
      }));
    },

    resetDemoData() {
      const cleanState = resetNucleoState();
      cachedState = cleanState;
      listeners.forEach((listener) => listener(cleanState));
    },
  }), []);

  return {
    state,
    actions,
    activeFocusSession: getActiveSession(state),
  };
}
