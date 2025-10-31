/**
 * Core utilities patched for Bun + Cloudflare compatibility.
 * Works locally without `cloudflare:workers`, and exports ok/bad/notFound helpers.
 */

import type { ApiResponse } from "@shared/types";
import type { Context } from "hono";

// ---------------------------------------------------------------------------
// Local Bun fallback for Cloudflare Workers
// ---------------------------------------------------------------------------

if (typeof globalThis.env === "undefined") {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[core-utils] ⚠️ Missing Supabase credentials in .env. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
    );
  }

  // @ts-ignore
  globalThis.env = {
    SUPABASE_URL: supabaseUrl ?? "",
    SUPABASE_ANON_KEY: supabaseAnonKey ?? "",
  };
}

// Try to import Cloudflare DurableObject class, fallback to stub for Bun
let DurableObjectClass: any;
try {
  // @ts-ignore
  const mod = await import("cloudflare:workers");
  DurableObjectClass = mod.DurableObject;
} catch {
  console.warn("[core-utils] Using stub DurableObject for local Bun mode");
  DurableObjectClass = class {
    ctx: any;
    env: any;
    constructor(ctx: any = {}, env: any = {}) {
      this.ctx = ctx;
      this.env = env;
      this.ctx.storage = {
        data: new Map(),
        async get(k: string) {
          return this.data.get(k);
        },
        async put(k: string, v: any) {
          this.data.set(k, v);
        },
        async delete(k: string) {
          this.data.delete(k);
        },
        async list() {
          return this.data;
        },
        async transaction(fn: any) {
          return await fn(this);
        },
        async deleteAll() {
          this.data.clear();
        },
      };
    }
  };
}

// ---------------------------------------------------------------------------
// Core DurableObject + API helpers (original logic retained)
// ---------------------------------------------------------------------------

export interface Env {
  GlobalDurableObject?: any;
}

type Doc<T> = { v: number; data: T };

export class GlobalDurableObject extends DurableObjectClass<Env, unknown> {
  constructor(public ctx: any, public env: Env) {
    super(ctx, env);
  }

  async del(key: string): Promise<boolean> {
    const existed = (await this.ctx.storage.get(key)) !== undefined;
    await this.ctx.storage.delete(key);
    return existed;
  }

  async has(key: string): Promise<boolean> {
    return (await this.ctx.storage.get(key)) !== undefined;
  }

  async getDoc<T>(key: string): Promise<Doc<T> | null> {
    const v = await this.ctx.storage.get<Doc<T>>(key);
    return v ?? null;
  }

  async casPut<T>(
    key: string,
    expectedV: number,
    data: T
  ): Promise<{ ok: boolean; v: number }> {
    return this.ctx.storage.transaction(async (txn: any) => {
      const cur = await txn.get<Doc<T>>(key);
      const curV = cur?.v ?? 0;
      if (curV !== expectedV) return { ok: false, v: curV };
      const nextV = curV + 1;
      await txn.put(key, { v: nextV, data });
      return { ok: true, v: nextV };
    });
  }
}

// ---------------------------------------------------------------------------
// JSON Response Helpers (REQUIRED for index.ts to import correctly)
// ---------------------------------------------------------------------------

export const ok = <T>(c: Context, data: T) =>
  c.json({ success: true, data } as ApiResponse<T>);
export const bad = (c: Context, error: string) =>
  c.json({ success: false, error } as ApiResponse, 400);
export const notFound = (c: Context, error = "not found") =>
  c.json({ success: false, error } as ApiResponse, 404);
