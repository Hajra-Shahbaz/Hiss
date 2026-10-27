import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  CONTENT_REGISTRY,
  ContentSlug,
  isContentSlug,
  type MediaType,
} from "@/lib/models";
import { requireAdmin } from "@/lib/auth";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  tooManyRequests,
  serverError,
  getClientIp,
  rateLimit,
  parseJsonBody,
  isValidObjectId,
} from "@/lib/utils";
import { validateContent } from "@/lib/validation";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";

/**
 * Single endpoint for all CRUD. Query string drives behaviour:
 *
 * Public reads (GET) — no token needed:
 *   GET /api/content?type=wishes
 *   GET /api/content?type=memories
 *   GET /api/content?type=all
 *
 * Admin writes (require Bearer admin token):
 *   POST   /api/content?type=wishes       ← create
 *   PATCH  /api/content?type=wishes&id=…  ← update
 *   DELETE /api/content?type=wishes&id=…&mode=soft|hard
 *   PATCH  /api/content?type=wishes&id=…&action=restore
 */

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseType(req: NextRequest): ContentSlug | null {
  const t = req.nextUrl.searchParams.get("type");
  if (!t || !isContentSlug(t)) return null;
  return t;
}

// ─────────────────────────────────────────────
// GET — public read (no gating)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`content-read:${ip}`, 120, 60);
    if (!limit.allowed) return tooManyRequests();

    await connectDB();
    const type = req.nextUrl.searchParams.get("type");

    // /api/content?type=all — returns every section at once
    if (type === "all") {
      const results: Record<string, unknown[]> = {};
      for (const [slug, cfg] of Object.entries(CONTENT_REGISTRY)) {
        const items = await cfg.model
          .find({ isDeleted: false })
          .sort({ order: 1, createdAt: 1 })
          .lean();
        results[slug] = items;
      }
      return ok(results);
    }

    const slug = parseType(req);
    if (!slug) return badRequest("Unknown or missing content type");

    const cfg = CONTENT_REGISTRY[slug];
    const items = await cfg.model
      .find({ isDeleted: false })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return ok(items);
  } catch (err) {
    console.error("[content GET]", err);
    return serverError();
  }
}

// ─────────────────────────────────────────────
// POST — admin create
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const slug = parseType(req);
    if (!slug) return badRequest("Unknown or missing content type");

    const body = await parseJsonBody(req);
    const v = validateContent(slug, body, { partial: false });
    if (!v.valid) return badRequest(v.errors.join("; "));

    await connectDB();
    const cfg = CONTENT_REGISTRY[slug];

    // Auto-assign order = max + 1 if not provided
    if (typeof v.sanitized.order !== "number") {
      const top = await cfg.model
        .findOne({ isDeleted: false })
        .sort({ order: -1 })
        .select("order")
        .lean<{ order: number } | null>();
      v.sanitized.order = (top?.order ?? -1) + 1;
    }

    const doc = await cfg.model.create(v.sanitized);
    return created(doc.toObject());
  } catch (err) {
    console.error("[content POST]", err);
    return serverError();
  }
}

// ─────────────────────────────────────────────
// PATCH — admin update / restore / reorder
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const slug = parseType(req);
    if (!slug) return badRequest("Unknown or missing content type");

    const id = req.nextUrl.searchParams.get("id");
    const action = req.nextUrl.searchParams.get("action");

    // ── restore ──
    if (action === "restore") {
      if (!isValidObjectId(id)) return badRequest("Invalid id");
      await connectDB();
      const cfg = CONTENT_REGISTRY[slug];
      const restored = await cfg.model.findByIdAndUpdate(
        id,
        { $set: { isDeleted: false, deletedAt: null } },
        { new: true },
      );
      if (!restored) return notFound();
      return ok(restored.toObject());
    }

    // ── reorder ──
    // Body: { ids: string[] }  — assigns order = index
    if (action === "reorder") {
      const body = await parseJsonBody<{ ids?: unknown }>(req);
      if (!body || !Array.isArray(body.ids))
        return badRequest("ids must be an array");
      const ids = body.ids as unknown[];
      if (!ids.every(isValidObjectId))
        return badRequest("Every id must be a valid ObjectId");

      await connectDB();
      const cfg = CONTENT_REGISTRY[slug];
      const ops = ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }));
      await cfg.model.bulkWrite(ops);
      return ok({ reordered: ids.length });
    }

    // ── normal update ──
    if (!isValidObjectId(id)) return badRequest("Invalid id");

    const body = await parseJsonBody(req);
    const v = validateContent(slug, body, { partial: true });
    if (!v.valid) return badRequest(v.errors.join("; "));
    if (Object.keys(v.sanitized).length === 0)
      return badRequest("No valid fields to update");

    await connectDB();
    const cfg = CONTENT_REGISTRY[slug];
    const updated = await cfg.model.findByIdAndUpdate(
      id,
      { $set: v.sanitized },
      { new: true, runValidators: true },
    );
    if (!updated) return notFound();
    return ok(updated.toObject());
  } catch (err) {
    console.error("[content PATCH]", err);
    return serverError();
  }
}

// ─────────────────────────────────────────────
// DELETE — soft or hard
// ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const slug = parseType(req);
    if (!slug) return badRequest("Unknown or missing content type");

    const id = req.nextUrl.searchParams.get("id");
    const mode = req.nextUrl.searchParams.get("mode") ?? "soft";
    if (mode !== "soft" && mode !== "hard")
      return badRequest('mode must be "soft" or "hard"');
    if (!isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();
    const cfg = CONTENT_REGISTRY[slug];

    if (mode === "soft") {
      const doc = await cfg.model.findByIdAndUpdate(
        id,
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!doc) return notFound();
      return ok({ softDeleted: true });
    }

    // hard delete — also destroy Cloudinary asset if present
    const doc = await cfg.model.findById(id);
    if (!doc) return notFound();

    if (cfg.mediaFields.length > 0) {
      for (const field of cfg.mediaFields) {
        const publicId = doc.get(field);
        const mediaTypeField = doc.get("mediaType") as MediaType | undefined;
        if (typeof publicId === "string" && publicId.length > 0) {
          await destroyCloudinaryAsset(
            publicId,
            mediaTypeField === "video" ? "video" : "image",
          );
        }
      }
    }

    await cfg.model.deleteOne({ _id: new Types.ObjectId(id) });
    return ok({ hardDeleted: true });
  } catch (err) {
    console.error("[content DELETE]", err);
    return serverError();
  }
}