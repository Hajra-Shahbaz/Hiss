import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  ok,
  badRequest,
  unauthorized,
  serverError,
  getClientIp,
  rateLimit,
  parseJsonBody,
} from "@/lib/utils";
import { validateEmailInput } from "@/lib/validation";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/email
 *   Header: Authorization: Bearer <adminToken>
 *   Body: EmailInput
 *   → { id }
 */

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const ip = getClientIp(req);
    const limit = rateLimit(`email:${ip}`, 10, 60);
    if (!limit.allowed) return badRequest("Too many emails. Slow down.");

    const body = await parseJsonBody(req);
    const v = validateEmailInput(body);
    if (!v.valid || !v.data) return badRequest(v.errors.join("; "));

    const result = await sendEmail(v.data);
    return ok(result);
  } catch (err) {
    console.error("[email]", err);
    return serverError("Email could not be sent");
  }
}