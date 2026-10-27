import { NextRequest } from "next/server";
import {
  createToken,
  requireAdmin,
  safeEqual,
} from "@/lib/auth";
import {
  ok,
  unauthorized,
  badRequest,
  tooManyRequests,
  serverError,
  getClientIp,
  rateLimit,
  parseJsonBody,
} from "@/lib/utils";
import { validatePin } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`admin-login:${ip}`, 5, 60);
    if (!limit.allowed) {
      return tooManyRequests(
        `Too many login attempts. Try again in ${limit.retryAfterSec}s.`,
      );
    }

    const body = await parseJsonBody(req);
    const pin = validatePin(body);
    if (!pin) return badRequest("PIN is required");

    const expected = process.env.ADMIN_PIN;
    if (!expected) {
      console.error("ADMIN_PIN not configured");
      return serverError("Server not configured");
    }

    if (!safeEqual(pin, expected)) {
      return unauthorized("Invalid PIN");
    }

    const ttl = Number(process.env.ADMIN_TOKEN_TTL_SECONDS ?? 7200);
    const token = createToken("admin", ttl);
    return ok({ token, expiresIn: ttl });
  } catch (err) {
    console.error("[admin/login]", err);
    return serverError();
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  return ok({ valid: true });
}