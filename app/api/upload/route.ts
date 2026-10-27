import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  ok,
  badRequest,
  unauthorized,
  serverError,
  getClientIp,
  rateLimit,
} from "@/lib/utils";
import { uploadToCloudinary, UploadError } from "@/lib/cloudinary";

/**
 * POST /api/upload
 *   Header: Authorization: Bearer <adminToken>
 *   Body: multipart/form-data with a single "file" field
 *   → { url, publicId, mediaType }
 */


export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const ip = getClientIp(req);
    const limit = rateLimit(`upload:${ip}`, 20, 60);
    if (!limit.allowed) return badRequest("Too many uploads. Slow down.");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return badRequest('Missing "file" field');

    const result = await uploadToCloudinary(file);
    return ok(result);
  } catch (err) {
    if (err instanceof UploadError) return badRequest(err.message);
    console.error("[upload]", err);
    return serverError("Upload failed");
  }
}

export async function GET() {
  return badRequest("Use POST to upload");
}