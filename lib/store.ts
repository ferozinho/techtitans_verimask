import { Redis } from "@upstash/redis";
import { SESSION_TTL_SECONDS, PICKUP_TTL_SECONDS } from "./constants";
import type { HolderBundle, VerifySession } from "./types";

type Memory = Map<string, { value: string; exp: number }>;

const globalStore = globalThis as typeof globalThis & {
  __verimaskMem?: Memory;
};

function memory(): Memory {
  if (!globalStore.__verimaskMem) globalStore.__verimaskMem = new Map();
  return globalStore.__verimaskMem;
}

function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

function sweep(map: Memory) {
  const now = Date.now();
  for (const [k, v] of map) if (v.exp < now) map.delete(k);
}

async function put(key: string, value: unknown, ttlSeconds: number) {
  const encoded = JSON.stringify(value);
  const r = redis();
  if (r) {
    await r.set(key, encoded, { ex: ttlSeconds });
    return;
  }
  const map = memory();
  sweep(map);
  map.set(key, { value: encoded, exp: Date.now() + ttlSeconds * 1000 });
}

async function get<T>(key: string): Promise<T | null> {
  const r = redis();
  if (r) {
    const raw = await r.get<string>(key);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
  }
  const map = memory();
  sweep(map);
  const hit = map.get(key);
  if (!hit) return null;
  return JSON.parse(hit.value) as T;
}

async function del(key: string) {
  const r = redis();
  if (r) {
    await r.del(key);
    return;
  }
  memory().delete(key);
}

export function usingRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export async function saveSession(session: VerifySession) {
  const ttl = Math.max(30, Math.ceil((session.expiresAt - Date.now()) / 1000));
  await put(`session:${session.id}`, session, Math.min(ttl, SESSION_TTL_SECONDS));
}

export async function loadSession(id: string): Promise<VerifySession | null> {
  return get<VerifySession>(`session:${id}`);
}

export async function savePickup(code: string, bundle: HolderBundle) {
  await put(`pickup:${code}`, bundle, PICKUP_TTL_SECONDS);
}

export async function takePickup(code: string): Promise<HolderBundle | null> {
  const bundle = await get<HolderBundle>(`pickup:${code.toUpperCase()}`);
  if (bundle) await del(`pickup:${code.toUpperCase()}`);
  return bundle;
}
