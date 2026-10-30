import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Video } from "@/lib/models";
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



export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`video-read:${ip}`, 60, 60);
    if (!limit.allowed) return badRequest("Too many requests");

    await connectDB();
    const doc = await Video.findOne().sort({ createdAt: -1 }).lean();
    return ok(doc ?? null);
  } catch (err) {
    console.error("[video GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return unauthorized();

    const body = await parseJsonBody<Record<string, unknown>>(req);
    if (!body) return badRequest("Body must be JSON");

    const media = typeof body.media === "string" ? body.media : "";
    const description =
      typeof body.description === "string" ? body.description : "";
    const publicId =
      typeof body.publicId === "string" ? body.publicId : undefined;

    if (!media || description.length === 0)
      return badRequest('"media" and "description" are required');

    try {
      new URL(media);
    } catch {
      return badRequest('"media" must be a valid URL');
    }

    await connectDB();
    const existing = await Video.findOne().sort({ createdAt: -1 });
    if (existing) {
      existing.set({
        media,
        description,
        ...(publicId ? { publicId } : {}),
      });
      await existing.save();
      return ok(existing.toObject());
    }
    const doc = await Video.create({ media, description, publicId });
    return ok(doc.toObject());
  } catch (err) {
    console.error("[video POST]", err);
    return serverError();
  }
}