import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { apiFetch } from "./api";
import { ApiError } from "./api";
import type { StudySession } from "./types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("studysmart-mobile.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS resource_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          path TEXT NOT NULL,
          method TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      return db;
    });
  }
  return databasePromise;
}

export async function cacheJson(key: string, value: unknown) {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO resource_cache (cache_key, payload, updated_at) VALUES (?, ?, ?)",
    key,
    JSON.stringify(value),
    Date.now()
  );
}

export async function readCachedJson<T>(key: string): Promise<T | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM resource_cache WHERE cache_key = ?",
    key
  );
  if (!row) {return null;}
  try {return JSON.parse(row.payload) as T;} catch {return null;}
}

export const cacheStudySession = (session: StudySession) => cacheJson("active-study-session", session);
export const readCachedStudySession = () => readCachedJson<StudySession>("active-study-session");
export async function clearCachedStudySession() {
  const db = await database();
  await db.runAsync("DELETE FROM resource_cache WHERE cache_key = ?", "active-study-session");
}

export async function queueStudyReview(payload: Record<string, unknown>) {
  const clientEventId = `review_${Crypto.randomUUID().replaceAll("-", "")}`;
  await queueApiMutation("/api/study/review", "POST", { ...payload, clientEventId }, clientEventId);
  return clientEventId;
}

export async function queueApiMutation(
  path: string,
  method: string,
  payload: Record<string, unknown>,
  id = `mutation_${Crypto.randomUUID().replaceAll("-", "")}`
) {
  const db = await database();
  await db.runAsync(
    "INSERT INTO sync_queue (id, path, method, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    id,
    path,
    method,
    JSON.stringify(payload),
    Date.now()
  );
  return id;
}

export async function queuedMutationCount() {
  const db = await database();
  const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM sync_queue");
  return row?.count ?? 0;
}

export async function flushSyncQueue() {
  const db = await database();
  const rows = await db.getAllAsync<{ id: string; path: string; method: string; payload: string }>(
    "SELECT id, path, method, payload FROM sync_queue ORDER BY created_at ASC LIMIT 100"
  );
  let synced = 0;
  for (const row of rows) {
    try {
      await apiFetch(row.path, { method: row.method, body: JSON.parse(row.payload) });
      await db.runAsync("DELETE FROM sync_queue WHERE id = ?", row.id);
      synced += 1;
    } catch (error) {
      const discard = error instanceof ApiError &&
        [400, 404, 409, 410, 415, 422].includes(error.status);
      if (!discard) {break;}
      await db.runAsync("DELETE FROM sync_queue WHERE id = ?", row.id);
    }
  }
  return { synced, remaining: await queuedMutationCount() };
}

export async function clearOfflineLearnerData() {
  const db = await database();
  await db.execAsync("DELETE FROM resource_cache; DELETE FROM sync_queue;");
}
