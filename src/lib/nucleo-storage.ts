import {
  createDefaultNucleoState,
  NUCLEO_SCHEMA_VERSION,
  type NucleoState,
} from "@/lib/nucleo-data";
import { calculateDashboardStats, calculateMissionProgress } from "@/lib/nucleo-rules";

export const NUCLEO_STORAGE_KEY = "atlasv01:nucleo-state:v1";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createHydratedDefaultState(): NucleoState {
  const state = createDefaultNucleoState();

  state.todayMission.progress = calculateMissionProgress(state);
  state.dashboardStats = calculateDashboardStats(state);

  return state;
}

export function migrateNucleoStateIfNeeded(state: unknown): NucleoState {
  const defaults = createHydratedDefaultState();

  if (!state || typeof state !== "object") {
    return defaults;
  }

  const candidate = state as Partial<NucleoState>;
  const merged: NucleoState = {
    ...defaults,
    ...candidate,
    schemaVersion: NUCLEO_SCHEMA_VERSION,
    dashboardStats: {
      ...defaults.dashboardStats,
      ...(candidate.dashboardStats ?? {}),
    },
    todayMission: {
      ...defaults.todayMission,
      ...(candidate.todayMission ?? {}),
      completionChecklist: Array.isArray(candidate.todayMission?.completionChecklist)
        ? candidate.todayMission.completionChecklist.map((item, index) => {
          if (typeof item === "string") {
            return {
              id: `check-${index + 1}`,
              text: item,
              done: false,
            };
          }

          return {
            ...defaults.todayMission.completionChecklist[index],
            ...item,
          };
        })
        : clone(defaults.todayMission.completionChecklist),
    },
    missions: Array.isArray(candidate.missions)
      ? candidate.missions
      : clone(defaults.missions),
    tasks: Array.isArray(candidate.tasks)
      ? candidate.tasks
      : clone(defaults.tasks),
    blockers: Array.isArray(candidate.blockers)
      ? candidate.blockers
      : clone(defaults.blockers),
    missionJourney: Array.isArray(candidate.missionJourney)
      ? candidate.missionJourney
      : clone(defaults.missionJourney),
    scopeTerritories: Array.isArray(candidate.scopeTerritories)
      ? candidate.scopeTerritories
      : clone(defaults.scopeTerritories),
    bossItems: Array.isArray(candidate.bossItems) ? candidate.bossItems : clone(defaults.bossItems),
    riskRadar: {
      ...defaults.riskRadar,
      ...(candidate.riskRadar ?? {}),
    },
    mentalEnergy: {
      ...defaults.mentalEnergy,
      ...(candidate.mentalEnergy ?? {}),
    },
    focusToday: {
      ...defaults.focusToday,
      ...(candidate.focusToday ?? {}),
    },
    operationalCards: {
      ...defaults.operationalCards,
      ...(candidate.operationalCards ?? {}),
      doNotToday: Array.isArray(candidate.operationalCards?.doNotToday)
        ? candidate.operationalCards.doNotToday.map((item, index) => {
          if (typeof item === "string") {
            return {
              id: `anti-${index + 1}`,
              text: item,
            };
          }

          return {
            ...defaults.operationalCards.doNotToday[index],
            ...item,
          };
        })
        : clone(defaults.operationalCards.doNotToday),
      waitingThirdParties: Array.isArray(candidate.operationalCards?.waitingThirdParties)
        ? candidate.operationalCards.waitingThirdParties
        : clone(defaults.operationalCards.waitingThirdParties),
      deliveryV01: {
        ...defaults.operationalCards.deliveryV01,
        ...(candidate.operationalCards?.deliveryV01 ?? {}),
      },
      recentVictories: Array.isArray(candidate.operationalCards?.recentVictories)
        ? candidate.operationalCards.recentVictories
        : clone(defaults.operationalCards.recentVictories),
    },
    projects: Array.isArray(candidate.projects) ? candidate.projects : clone(defaults.projects),
    focusSessions: Array.isArray(candidate.focusSessions) ? candidate.focusSessions : [],
    victories: Array.isArray(candidate.victories) ? candidate.victories : clone(defaults.victories),
    antiDriftLog: Array.isArray(candidate.antiDriftLog) ? candidate.antiDriftLog : [],
    archiveItems: Array.isArray(candidate.archiveItems) ? candidate.archiveItems : clone(defaults.archiveItems),
    history: Array.isArray(candidate.history) ? candidate.history : clone(defaults.history),
    alerts: Array.isArray(candidate.alerts) ? candidate.alerts : [],
    lastUpdatedAt: typeof candidate.lastUpdatedAt === "string" ? candidate.lastUpdatedAt : defaults.lastUpdatedAt,
  };

  merged.todayMission.progress = calculateMissionProgress(merged);
  merged.dashboardStats = calculateDashboardStats(merged);

  return merged;
}

export function loadNucleoState(): NucleoState {
  if (!canUseLocalStorage()) {
    return createHydratedDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(NUCLEO_STORAGE_KEY);
    if (!raw) {
      return createHydratedDefaultState();
    }

    return migrateNucleoStateIfNeeded(JSON.parse(raw));
  } catch {
    return createHydratedDefaultState();
  }
}

export function saveNucleoState(state: NucleoState) {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(NUCLEO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can fail in private mode or when quota is exceeded.
  }
}

export function resetNucleoState(): NucleoState {
  const state = createHydratedDefaultState();

  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(NUCLEO_STORAGE_KEY);
    } catch {
      // Ignore reset failures; caller still receives a clean in-memory state.
    }
  }

  return state;
}
