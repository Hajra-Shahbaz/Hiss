import { NextRequest } from "next/server";
import { createToken, safeEqual } from "@/lib/auth";
import {
  ok,
  badRequest,
  unauthorized,
  tooManyRequests,
  serverError,
  getClientIp,
  rateLimit,
  parseJsonBody,
} from "@/lib/utils";
import { validateSecretDate } from "@/lib/validation";

/**
 * POST /api/secret
 *   Body: { secret: string }
 *   → { token, expiresIn }
 *
 * The secret itself is NEVER returned.
 */

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`secret-gate:${ip}`, 8, 60);
    if (!limit.allowed) {
      return tooManyRequests(
        `Too many attempts. Try again in ${limit.retryAfterSec}s.`,
      );
    }

    const body = await parseJsonBody(req);
    const attempt = validateSecretDate(body);
    if (!attempt) return badRequest("Secret is required");

    const expected = process.env.SECRET_DATE;
    if (!expected) {
      console.error("SECRET_DATE not configured");
      return serverError("Server not configured");
    }

    if (!safeEqual(attempt, expected)) {
      return unauthorized("That doesn't look right");
    }

    const ttl = Number(process.env.SECRET_GATE_TTL_SECONDS ?? 3600);
    const token = createToken("gate", ttl);
    return ok({ token, expiresIn: ttl });
  } catch (err) {
    console.error("[secret/verify]", err);
    return serverError();
  }
}