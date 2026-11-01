import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  ok,
  badRequest,
  unauthorized,
  serverError,
  parseJsonBody,
} from "@/lib/utils";
import { validateEmailInput, type EmailInput } from "@/lib/validation";
import { renderEmailTemplate } from "@/lib/email";

/**
 * POST /api/email/preview
 *   Header: Authorization: Bearer <adminToken>
 *   Body:   EmailInput
 *   →       { html }
 *
 * Renders the EXACT same HTML as POST /api/email — without sending.
 * Uses the same validation + template renderer, so preview == final email.
 */

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const raw = (await parseJsonBody(req)) as Partial<EmailInput> | null;

    // Allow preview before a recipient is typed — the modal UX lets
    // the admin tweak fields before deciding on a real address.
    const body: Partial<EmailInput> = {
      ...(raw ?? {}),
      to:
        raw && typeof raw.to === "string" && raw.to.trim()
          ? raw.to
          : "preview@example.com",
    };

    const v = validateEmailInput(body);
    if (!v.valid || !v.data) return badRequest(v.errors.join("; "));

    const html = renderEmailTemplate(v.data);
    return ok({ html });
  } catch (err) {
    console.error("[email/preview]", err);
    return serverError("Preview could not be generated");
  }
}