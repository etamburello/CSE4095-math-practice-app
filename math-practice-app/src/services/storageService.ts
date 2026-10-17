import type { ActiveSessionState, PracticeAttempt, PracticeSession } from "../types/session";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";
import { createEmptyStatistics, type AppStatistics } from "../types/statistics";
import type { MistakePattern } from "../types/mistake";
import {
  isActiveSession,
  isAppSettings,
  isAppStatistics,
  isMistakePattern,
  isPracticeAttempt,
  isPracticeSession,
} from "../utils/validation";

export const SCHEMA_VERSION = 1;

export const MAX_STORED_ATTEMPTS = 3000;
export const MAX_STORED_SESSIONS = 40;

export const STORAGE_KEYS = {
  settings: "mathPractice.settings",
  sessions: "mathPractice.sessions",
  attempts: "mathPractice.attempts",
  mistakePatterns: "mathPractice.mistakePatterns",
  statistics: "mathPractice.statistics",
  version: "mathPractice.version",
  activeSession: "mathPractice.activeSession",
} as const;

export const STORAGE_WARNING =
  "This browser could not save practice data. You can keep practicing, but progress might not be stored.";

export interface LoadedData {
  settings: AppSettings;
  sessions: PracticeSession[];
  attempts: PracticeAttempt[];
  mistakePatterns: MistakePattern[];
  statistics: AppStatistics;
  activeSession: ActiveSessionState | null;
  warning: string | null;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function unavailableWarning(): string {
  return "This browser is not saving practice data. You can keep practicing during this visit.";
}

function readRaw(storage: Store, key: string): { ok: true; value: string | null } | { ok: false } {
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch {
    return { ok: false };
  }
}

function writeRaw(storage: Store, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeRaw(storage: Store, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage that rejects deletes.
  }
}

function parseJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function readSchemaVersion(storage: Store): number | null {
  const raw = readRaw(storage, STORAGE_KEYS.version);
  if (!raw.ok || raw.value === null) {
    return null;
  }
  const parsed = parseJson(raw.value);
  if (typeof parsed === "number") {
    return parsed;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    typeof parsed.version === "number"
  ) {
    return parsed.version;
  }
  return null;
}

export function writeSchemaVersion(storage: Store, version = SCHEMA_VERSION): boolean {
  return writeRaw(storage, STORAGE_KEYS.version, JSON.stringify({ version }));
}

/**
 * Future schema changes register a function here. Each function migrates
 * stored data from its key version to the next version.
 */
const migrations: Record<number, (storage: Store) => void> = {};

export function migrateStorage(storage: Store): string | null {
  const version = readSchemaVersion(storage);
  if (version === null) {
    writeSchemaVersion(storage, SCHEMA_VERSION);
    return null;
  }
  if (version > SCHEMA_VERSION) {
    return "Saved practice data is from a newer version of this app. Some progress may be skipped.";
  }
  let current = version;
  while (current < SCHEMA_VERSION) {
    const step = migrations[current];
    if (!step) {
      break;
    }
    step(storage);
    current += 1;
    writeSchemaVersion(storage, current);
  }
  return null;
}

function loadList<T>(
  storage: Store,
  key: string,
  guard: (value: unknown) => value is T,
): { items: T[]; invalid: boolean; failed: boolean } {
  const raw = readRaw(storage, key);
  if (!raw.ok) {
    return { items: [], invalid: false, failed: true };
  }
  if (raw.value === null) {
    return { items: [], invalid: false, failed: false };
  }
  const parsed = parseJson(raw.value);
  if (parsed === undefined || !Array.isArray(parsed)) {
    return { items: [], invalid: true, failed: false };
  }
  const items = parsed.filter((item) => guard(item));
  return { items, invalid: items.length !== parsed.length, failed: false };
}

export function loadAll(storage: Store): LoadedData {
  const warnings: string[] = [];
  const migrationWarning = migrateStorage(storage);
  if (migrationWarning) {
    warnings.push(migrationWarning);
  }

  const settingsRaw = readRaw(storage, STORAGE_KEYS.settings);
  let settings = {
    ...DEFAULT_SETTINGS,
    defaultOperations: [...DEFAULT_SETTINGS.defaultOperations],
  };
  if (!settingsRaw.ok) {
    warnings.push(unavailableWarning());
  } else if (settingsRaw.value !== null) {
    const parsed = parseJson(settingsRaw.value);
    if (parsed === undefined || !isAppSettings(parsed)) {
      warnings.push("Saved settings could not be read, so the app is using the usual settings.");
    } else {
      settings = { ...parsed, defaultOperations: [...new Set(parsed.defaultOperations)] };
    }
  }

  const sessions = loadList(storage, STORAGE_KEYS.sessions, isPracticeSession);
  const attempts = loadList(storage, STORAGE_KEYS.attempts, isPracticeAttempt);
  const mistakes = loadList(storage, STORAGE_KEYS.mistakePatterns, isMistakePattern);
  if (sessions.failed || attempts.failed || mistakes.failed) {
    warnings.push(unavailableWarning());
  }
  if (sessions.invalid) {
    warnings.push("Some saved sessions were skipped because they could not be read.");
  }
  if (attempts.invalid) {
    warnings.push("Some saved answers were skipped because they could not be read.");
  }
  if (mistakes.invalid) {
    warnings.push("Some saved mistakes were skipped because they could not be read.");
  }

  const statsRaw = readRaw(storage, STORAGE_KEYS.statistics);
  let statistics = createEmptyStatistics();
  if (statsRaw.ok && statsRaw.value !== null) {
    const parsed = parseJson(statsRaw.value);
    if (parsed === undefined || !isAppStatistics(parsed)) {
      warnings.push("Saved statistics could not be read, so those totals were reset.");
    } else {
      statistics = parsed;
    }
  }

  let activeSession: ActiveSessionState | null = null;
  const activeRaw = readRaw(storage, STORAGE_KEYS.activeSession);
  if (activeRaw.ok && activeRaw.value !== null) {
    const parsed = parseJson(activeRaw.value);
    if (parsed === undefined || !isActiveSession(parsed)) {
      warnings.push("A saved practice session could not be restored.");
      removeRaw(storage, STORAGE_KEYS.activeSession);
    } else {
      activeSession = parsed;
    }
  }

  return {
    settings,
    sessions: sessions.items.slice(0, MAX_STORED_SESSIONS),
    attempts: attempts.items.slice(-MAX_STORED_ATTEMPTS),
    mistakePatterns: mistakes.items,
    statistics,
    activeSession,
    warning: warnings[0] ?? null,
  };
}

export interface PersistedSnapshot {
  settings: AppSettings;
  sessions: readonly PracticeSession[];
  attempts: readonly PracticeAttempt[];
  mistakePatterns: readonly MistakePattern[];
  statistics: AppStatistics;
  activeSession: ActiveSessionState | null;
}

export function saveAll(storage: Store, snapshot: PersistedSnapshot): string | null {
  writeSchemaVersion(storage, SCHEMA_VERSION);
  const attempts = snapshot.attempts.slice(-MAX_STORED_ATTEMPTS);
  const sessions = snapshot.sessions.slice(0, MAX_STORED_SESSIONS);
  const writes: Array<[string, string]> = [
    [STORAGE_KEYS.settings, JSON.stringify(snapshot.settings)],
    [STORAGE_KEYS.sessions, JSON.stringify(sessions)],
    [STORAGE_KEYS.attempts, JSON.stringify(attempts)],
    [STORAGE_KEYS.mistakePatterns, JSON.stringify(snapshot.mistakePatterns)],
    [STORAGE_KEYS.statistics, JSON.stringify(snapshot.statistics)],
  ];
  if (snapshot.activeSession) {
    writes.push([STORAGE_KEYS.activeSession, JSON.stringify(snapshot.activeSession)]);
  }

  const failed = writes.some(([key, value]) => !writeRaw(storage, key, value));
  if (!snapshot.activeSession) {
    removeRaw(storage, STORAGE_KEYS.activeSession);
  }
  if (!failed) {
    return null;
  }

  const trimmedAttempts = attempts.slice(-Math.ceil(attempts.length / 2));
  const retried = writeRaw(storage, STORAGE_KEYS.attempts, JSON.stringify(trimmedAttempts));
  if (!retried) {
    return STORAGE_WARNING;
  }
  return STORAGE_WARNING;
}

export function clearPracticeHistory(storage: Store): string | null {
  removeRaw(storage, STORAGE_KEYS.sessions);
  removeRaw(storage, STORAGE_KEYS.attempts);
  removeRaw(storage, STORAGE_KEYS.mistakePatterns);
  removeRaw(storage, STORAGE_KEYS.activeSession);
  const statsSaved = writeRaw(
    storage,
    STORAGE_KEYS.statistics,
    JSON.stringify(createEmptyStatistics()),
  );
  writeSchemaVersion(storage, SCHEMA_VERSION);
  return statsSaved ? null : STORAGE_WARNING;
}

export function clearAllData(storage: Store): string | null {
  const warning = clearPracticeHistory(storage);
  const settingsSaved = writeRaw(storage, STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
  return warning ?? (settingsSaved ? null : STORAGE_WARNING);
}
