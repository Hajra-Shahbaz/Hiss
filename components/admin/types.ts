export type ContentSlug =
  | "wishes"
  | "congratulations"
  | "memories"
  | "moments"
  | "promises"
  | "sorry"
  | "thankyou";

export type FieldKind = "text" | "textarea" | "emoji" | "media";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  placeholder?: string;
}

export interface CategoryDef {
  slug: ContentSlug;
  label: string;
  description: string;
  fields: FieldDef[];
}

export interface ContentDoc {
  _id: string;
  order: number;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  emoji?: string;
  description?: string;
  media?: string;
  mediaType?: "image" | "video";
  heading?: string;
  note?: string;
  notes?: string;
  detail?: string;
  publicId?: string;
}

export interface VideoDoc {
  _id?: string;
  media: string;
  description: string;
  publicId?: string;
}

export type Tab =
  | { kind: "category"; slug: ContentSlug }
  | { kind: "video" }
  | { kind: "email" };

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "wishes",
    label: "Wishes",
    description: "Sweet birthday wishes with an emoji and a message.",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true, placeholder: "💙" },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "congratulations",
    label: "Congratulations",
    description: "Media cards with a heading and description.",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "memories",
    label: "Memories",
    description: "Photos and videos with a caption.",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "moments",
    label: "Moments",
    description: "Media cards with a heading and a note.",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "note", label: "Note", kind: "textarea", required: true },
    ],
  },
  {
    slug: "promises",
    label: "Promises",
    description: "Emoji + heading + detail.",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "detail", label: "Detail", kind: "textarea", required: true },
    ],
  },
  {
    slug: "sorry",
    label: "Sorry",
    description: "A single note.",
    fields: [{ name: "note", label: "Note", kind: "textarea", required: true }],
  },
  {
    slug: "thankyou",
    label: "Thank You",
    description: "Emoji + notes.",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true },
      { name: "notes", label: "Notes", kind: "textarea", required: true },
    ],
  },
];