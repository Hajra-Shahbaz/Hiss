import mongoose, { Schema, Model, Document, Types } from "mongoose";

// ─────────────────────────────────────────────
// Shared base fields
// Every content document has: order, isDeleted, deletedAt, timestamps
// ─────────────────────────────────────────────

export interface BaseContent {
  order: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MediaType = "image" | "video";

export interface IWish extends BaseContent, Document {
  emoji: string;
  description: string;
}

export interface ICongratulation extends BaseContent, Document {
  media: string;
  mediaType: MediaType;
  heading: string;
  description: string;
  publicId?: string;
}

export interface IMemory extends BaseContent, Document {
  media: string;
  mediaType: MediaType;
  description: string;
  publicId?: string;
}

export interface IMoment extends BaseContent, Document {
  media: string;
  mediaType: MediaType;
  heading: string;
  note: string;
  publicId?: string;
}

export interface IPromise extends BaseContent, Document {
  heading: string;
  emoji: string;
  detail: string;
}

export interface ISorry extends BaseContent, Document {
  note: string;
}

export interface IThankYou extends BaseContent, Document {
  emoji: string;
  notes: string;
}

// Singleton — the main video shown in Step 4
export interface IVideo extends Document {
  media: string;
  description: string;
  publicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Shared base schema (adds order + soft-delete + timestamps)
// ─────────────────────────────────────────────

function withBaseFields<T extends mongoose.Schema>(schema: T): T {
  schema.add({
    order: { type: Number, default: 0, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false, required: true },
    deletedAt: { type: Date, default: null },
  });
  return schema;
}

const baseOptions = {
  timestamps: true,
  versionKey: false,
} as const;

// ─────────────────────────────────────────────
// 1. Wishes
// ─────────────────────────────────────────────

const WishSchema = withBaseFields(
  new Schema<IWish>(
    {
      emoji: { type: String, required: true, trim: true, maxlength: 16 },
      description: { type: String, required: true, trim: true, maxlength: 500 },
    },
    baseOptions,
  ),
);
WishSchema.index({ isDeleted: 1, order: 1 });

export const Wish: Model<IWish> =
  (mongoose.models.Wish as Model<IWish>) || mongoose.model<IWish>("Wish", WishSchema);

// ─────────────────────────────────────────────
// 2. Congratulations
// ─────────────────────────────────────────────

const CongratulationSchema = withBaseFields(
  new Schema<ICongratulation>(
    {
      media: { type: String, required: true, trim: true },
      mediaType: { type: String, enum: ["image", "video"], required: true },
      heading: { type: String, required: true, trim: true, maxlength: 200 },
      description: { type: String, required: true, trim: true, maxlength: 1000 },
      publicId: { type: String, trim: true },
    },
    baseOptions,
  ),
);
CongratulationSchema.index({ isDeleted: 1, order: 1 });

export const Congratulation: Model<ICongratulation> =
  (mongoose.models.Congratulation as Model<ICongratulation>) ||
  mongoose.model<ICongratulation>("Congratulation", CongratulationSchema);

// ─────────────────────────────────────────────
// 3. Memories
// ─────────────────────────────────────────────

const MemorySchema = withBaseFields(
  new Schema<IMemory>(
    {
      media: { type: String, required: true, trim: true },
      mediaType: { type: String, enum: ["image", "video"], required: true },
      description: { type: String, required: true, trim: true, maxlength: 1000 },
      publicId: { type: String, trim: true },
    },
    baseOptions,
  ),
);
MemorySchema.index({ isDeleted: 1, order: 1 });

export const Memory: Model<IMemory> =
  (mongoose.models.Memory as Model<IMemory>) || mongoose.model<IMemory>("Memory", MemorySchema);

// ─────────────────────────────────────────────
// 4. Moments
// ─────────────────────────────────────────────

const MomentSchema = withBaseFields(
  new Schema<IMoment>(
    {
      media: { type: String, required: true, trim: true },
      mediaType: { type: String, enum: ["image", "video"], required: true },
      heading: { type: String, required: true, trim: true, maxlength: 200 },
      note: { type: String, required: true, trim: true, maxlength: 1000 },
      publicId: { type: String, trim: true },
    },
    baseOptions,
  ),
);
MomentSchema.index({ isDeleted: 1, order: 1 });

export const Moment: Model<IMoment> =
  (mongoose.models.Moment as Model<IMoment>) || mongoose.model<IMoment>("Moment", MomentSchema);

// ─────────────────────────────────────────────
// 5. Promises
// ─────────────────────────────────────────────

const PromiseSchema = withBaseFields(
  new Schema<IPromise>(
    {
      heading: { type: String, required: true, trim: true, maxlength: 200 },
      emoji: { type: String, required: true, trim: true, maxlength: 16 },
      detail: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    baseOptions,
  ),
);
PromiseSchema.index({ isDeleted: 1, order: 1 });

export const PromiseModel: Model<IPromise> =
  (mongoose.models.Promise as Model<IPromise>) ||
  mongoose.model<IPromise>("Promise", PromiseSchema);

// ─────────────────────────────────────────────
// 6. Sorry
// ─────────────────────────────────────────────

const SorrySchema = withBaseFields(
  new Schema<ISorry>(
    {
      note: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    baseOptions,
  ),
);
SorrySchema.index({ isDeleted: 1, order: 1 });

export const Sorry: Model<ISorry> =
  (mongoose.models.Sorry as Model<ISorry>) || mongoose.model<ISorry>("Sorry", SorrySchema);

// ─────────────────────────────────────────────
// 7. Thank You
// ─────────────────────────────────────────────

const ThankYouSchema = withBaseFields(
  new Schema<IThankYou>(
    {
      emoji: { type: String, required: true, trim: true, maxlength: 16 },
      notes: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    baseOptions,
  ),
);
ThankYouSchema.index({ isDeleted: 1, order: 1 });

export const ThankYou: Model<IThankYou> =
  (mongoose.models.ThankYou as Model<IThankYou>) ||
  mongoose.model<IThankYou>("ThankYou", ThankYouSchema);

// ─────────────────────────────────────────────
// 8. Video (singleton for Step 4)
// ─────────────────────────────────────────────

const VideoSchema = new Schema<IVideo>(
  {
    media: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    publicId: { type: String, trim: true },
  },
  baseOptions,
);

export const Video: Model<IVideo> =
  (mongoose.models.Video as Model<IVideo>) || mongoose.model<IVideo>("Video", VideoSchema);

// ─────────────────────────────────────────────
// Registry — used by the generic content API
// Maps a public slug to { model, requiredFields }
// ─────────────────────────────────────────────

export type ContentSlug =
  | "wishes"
  | "congratulations"
  | "memories"
  | "moments"
  | "promises"
  | "sorry"
  | "thankyou";

export interface ContentConfig {
  model: Model<any>;
  fields: string[]; // editable field names (for validation whitelist)
  mediaFields: string[]; // fields that may store a Cloudinary publicId
  isGated: boolean; // requires secret-gate token to read
}

export const CONTENT_REGISTRY: Record<ContentSlug, ContentConfig> = {
  wishes: {
    model: Wish,
    fields: ["emoji", "description", "order"],
    mediaFields: [],
    isGated: false,
  },
  congratulations: {
    model: Congratulation,
    fields: ["media", "mediaType", "heading", "description", "publicId", "order"],
    mediaFields: ["publicId"],
    isGated: false,
  },
  memories: {
    model: Memory,
    fields: ["media", "mediaType", "description", "publicId", "order"],
    mediaFields: ["publicId"],
    isGated: true,
  },
  moments: {
    model: Moment,
    fields: ["media", "mediaType", "heading", "note", "publicId", "order"],
    mediaFields: ["publicId"],
    isGated: true,
  },
  promises: {
    model: PromiseModel,
    fields: ["heading", "emoji", "detail", "order"],
    mediaFields: [],
    isGated: true,
  },
  sorry: {
    model: Sorry,
    fields: ["note", "order"],
    mediaFields: [],
    isGated: true,
  },
  thankyou: {
    model: ThankYou,
    fields: ["emoji", "notes", "order"],
    mediaFields: [],
    isGated: true,
  },
};

export function isContentSlug(v: string): v is ContentSlug {
  return v in CONTENT_REGISTRY;
}