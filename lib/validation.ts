import { ContentSlug, CONTENT_REGISTRY } from "./models";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: Record<string, unknown>;
}

/**
 * Whitelist-only validation. Rejects unknown fields silently (they are dropped).
 * Type-checks every value against the expected type for the given content slug.
 */
export function validateContent(
  slug: ContentSlug,
  input: unknown,
  { partial = false }: { partial?: boolean } = {},
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, errors: ["Body must be a JSON object"], sanitized: {} };
  }
  const obj = input as Record<string, unknown>;
  const config = CONTENT_REGISTRY[slug];

  const rules = fieldRules[slug];

  for (const field of config.fields) {
    const rule = rules[field];
    if (!rule) continue; // order is handled separately below

    const present = Object.prototype.hasOwnProperty.call(obj, field);
    if (!present) {
      if (!partial && rule.required) errors.push(`"${field}" is required`);
      continue;
    }
    const v = obj[field];
    const check = rule.check(v);
    if (!check.ok) {
      errors.push(`"${field}" ${check.message}`);
      continue;
    }
    sanitized[field] = v;
  }

  // order: optional integer, auto-assigned if omitted on create
  if (Object.prototype.hasOwnProperty.call(obj, "order")) {
    const o = obj.order;
    if (typeof o !== "number" || !Number.isInteger(o) || o < 0) {
      errors.push(`"order" must be a non-negative integer`);
    } else {
      sanitized.order = o;
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

// ─────────────────────────────────────────────
// Field rules
// ─────────────────────────────────────────────

type Check = { ok: true } | { ok: false; message: string };

interface FieldRule {
  required: boolean;
  check: (v: unknown) => Check;
}

function str(opts: { min?: number; max?: number; nonEmpty?: boolean } = {}): (v: unknown) => Check {
  return (v) => {
    if (typeof v !== "string") return { ok: false, message: "must be a string" };
    const t = v.trim();
    if (opts.nonEmpty && t.length === 0) return { ok: false, message: "must not be empty" };
    if (opts.min !== undefined && t.length < opts.min)
      return { ok: false, message: `must be at least ${opts.min} chars` };
    if (opts.max !== undefined && t.length > opts.max)
      return { ok: false, message: `must be at most ${opts.max} chars` };
    return { ok: true };
  };
}

function urlStr(v: unknown): Check {
  if (typeof v !== "string" || v.length === 0) return { ok: false, message: "must be a URL string" };
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:")
      return { ok: false, message: "must be an http(s) URL" };
    return { ok: true };
  } catch {
    return { ok: false, message: "must be a valid URL" };
  }
}

function mediaType(v: unknown): Check {
  if (v !== "image" && v !== "video") return { ok: false, message: 'must be "image" or "video"' };
  return { ok: true };
}

const requiredStr = { required: true, check: str({ nonEmpty: true, max: 1000 }) };

const fieldRules: Record<ContentSlug, Record<string, FieldRule>> = {
  wishes: {
    emoji: { required: true, check: str({ nonEmpty: true, max: 16 }) },
    description: { required: true, check: str({ nonEmpty: true, max: 500 }) },
  },
  congratulations: {
    media: { required: true, check: urlStr },
    mediaType: { required: true, check: mediaType },
    heading: requiredStr,
    description: requiredStr,
    publicId: { required: false, check: str({ nonEmpty: true, max: 300 }) },
  },
  memories: {
    media: { required: true, check: urlStr },
    mediaType: { required: true, check: mediaType },
    description: requiredStr,
    publicId: { required: false, check: str({ nonEmpty: true, max: 300 }) },
  },
  moments: {
    media: { required: true, check: urlStr },
    mediaType: { required: true, check: mediaType },
    heading: requiredStr,
    note: requiredStr,
    publicId: { required: false, check: str({ nonEmpty: true, max: 300 }) },
  },
  promises: {
    heading: requiredStr,
    emoji: { required: true, check: str({ nonEmpty: true, max: 16 }) },
    detail: requiredStr,
  },
  sorry: {
    note: requiredStr,
  },
  thankyou: {
    emoji: { required: true, check: str({ nonEmpty: true, max: 16 }) },
    notes: requiredStr,
  },
};

// ─────────────────────────────────────────────
// Login / gate / email validators
// ─────────────────────────────────────────────

export function validatePin(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const pin = (input as { pin?: unknown }).pin;
  if (typeof pin !== "string" || pin.length < 4 || pin.length > 128) return null;
  return pin;
}

export function validateSecretDate(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const v = (input as { secret?: unknown }).secret;
  if (typeof v !== "string" || v.length === 0 || v.length > 200) return null;
  return v;
}

export interface EmailInput {
  to: string;
  subject: string;
  recipientName: string;
  heading: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  closing?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailInput(input: unknown): {
  valid: boolean;
  errors: string[];
  data: EmailInput | null;
} {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null)
    return { valid: false, errors: ["Body must be an object"], data: null };
  const o = input as Record<string, unknown>;

  const to = typeof o.to === "string" ? o.to.trim() : "";
  if (!EMAIL_RE.test(to)) errors.push('"to" must be a valid email address');

  const subject = typeof o.subject === "string" ? o.subject.trim() : "";
  if (!subject || subject.length > 200) errors.push('"subject" must be 1–200 chars');

  const recipientName = typeof o.recipientName === "string" ? o.recipientName.trim() : "";
  if (!recipientName || recipientName.length > 100)
    errors.push('"recipientName" must be 1–100 chars');

  const heading = typeof o.heading === "string" ? o.heading.trim() : "";
  if (!heading || heading.length > 200) errors.push('"heading" must be 1–200 chars');

  const message = typeof o.message === "string" ? o.message.trim() : "";
  if (!message || message.length > 5000) errors.push('"message" must be 1–5000 chars');

  const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : undefined;
  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch {
      errors.push('"imageUrl" must be a valid URL');
    }
  }

  const buttonText = typeof o.buttonText === "string" ? o.buttonText.trim() : undefined;
  if (buttonText && buttonText.length > 60) errors.push('"buttonText" must be ≤ 60 chars');

  const buttonUrl = typeof o.buttonUrl === "string" ? o.buttonUrl.trim() : undefined;
  if (buttonUrl) {
    try {
      new URL(buttonUrl);
    } catch {
      errors.push('"buttonUrl" must be a valid URL');
    }
  }

  const closing = typeof o.closing === "string" ? o.closing.trim() : undefined;

  if (errors.length) return { valid: false, errors, data: null };

  return {
    valid: true,
    errors: [],
    data: { to, subject, recipientName, heading, message, imageUrl, buttonText, buttonUrl, closing },
  };
}