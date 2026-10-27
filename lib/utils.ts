import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// API response helpers
// ─────────────────────────────────────────────

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return fail(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return fail(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found") {
  return fail(message, 404, "NOT_FOUND");
}

export function badRequest(message = "Bad request") {
  return fail(message, 400, "BAD_REQUEST");
}

export function tooManyRequests(message = "Too many requests") {
  return fail(message, 429, "RATE_LIMITED");
}

export function serverError(message = "Something went wrong") {
  // Never leak stack traces to the client.
  return fail(message, 500, "INTERNAL_ERROR");
}

// ─────────────────────────────────────────────
// Simple in-memory rate limiter
// NOTE: Vercel serverless functions may run on multiple instances, so this
// limits per-instance. For stricter limits, use Upstash Redis — but for an
// admin panel with a single user, this is proportionate and dependency-free.
// ─────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _rateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  global._rateLimitBuckets ?? (global._rateLimitBuckets = new Map());

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, max: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: max - 1, retryAfterSec: windowSec };
  }
  existing.count += 1;
  if (existing.count > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { allowed: true, remaining: max - existing.count, retryAfterSec: 0 };
}

/** Best-effort client IP extraction (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─────────────────────────────────────────────
// Safe JSON body parse
// ─────────────────────────────────────────────

export async function parseJsonBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Mongo ObjectId guard
// ─────────────────────────────────────────────

export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}