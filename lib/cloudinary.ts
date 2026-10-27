import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  // Do not throw at import time in a way that breaks builds —
  // the API will surface a clear error if these are missing.
  console.warn("[cloudinary] Missing credentials in environment");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];
const ALLOWED_VIDEO_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/ogg",
];

export interface UploadResult {
  url: string;
  publicId: string;
  mediaType: "image" | "video";
  bytes: number;
}

/**
 * Upload a File to Cloudinary using an authenticated server-side upload.
 * We use `upload_stream` with a Buffer rather than trusting a signed client upload,
 * because the file has to pass through this server anyway for validation.
 */
export async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const mime = file.type;
  const isImage = ALLOWED_IMAGE_MIME.includes(mime);
  const isVideo = ALLOWED_VIDEO_MIME.includes(mime);

  if (!isImage && !isVideo) {
    throw new UploadError(`Unsupported file type: ${mime || "unknown"}`);
  }

  const sizeLimit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > sizeLimit) {
    throw new UploadError(
      `File too large. Max ${Math.round(sizeLimit / 1024 / 1024)} MB for ${isImage ? "images" : "videos"}.`,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "image",
        folder: "umer-birthday",
      },
      (err, result) => {
        if (err || !result) return reject(new UploadError("Cloudinary upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          mediaType: isVideo ? "video" : "image",
          bytes: result.bytes ?? file.size,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Permanently destroy a Cloudinary asset. Best-effort — logs and swallows errors. */
export async function destroyCloudinaryAsset(
  publicId: string,
  mediaType: "image" | "video",
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: mediaType === "video" ? "video" : "image",
      invalidate: true,
    });
  } catch (err) {
    console.error("[cloudinary] destroy failed", publicId, err);
  }
}

export class UploadError extends Error {}