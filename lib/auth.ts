import crypto from "crypto";

/**
 * HMAC-SHA256 signed bearer token.
 * Format: base64url(payloadJson) + "." + base64url(hmac)
 *
 * Payload: { sub: "admin" | "gate", exp: number (unix seconds), iat: number }
 *
 * Why not JWT? We don't need a library. This is the same math with fewer deps.
 * Why HMAC? Symmetric, simple, cryptographically sound for a single-server secret.
 */

export type TokenSubject = "admin" | "gate";

interface TokenPayload {
  sub: TokenSubject;
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Buffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

function sign(payloadStr: string, secret: string): string {
  return base64url(crypto.createHmac("sha256", secret).update(payloadStr).digest());
}

export function createToken(subject: TokenSubject, ttlSeconds: number): string {
  const secret = getSecretFor(subject);
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { sub: subject, iat: now, exp: now + ttlSeconds };
  const payloadStr = JSON.stringify(payload);
  const encoded = base64url(payloadStr);
  const sig = sign(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string | null | undefined, expected: TokenSubject): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encoded, sig] = parts;
  const secret = getSecretFor(expected);
  const expectedSig = sign(encoded, secret);

  // Constant-time compare
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  // Decode & validate payload
  try {
    const json = fromBase64url(encoded).toString("utf8");
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.sub !== expected) return false;
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

function getSecretFor(subject: TokenSubject): string {
  if (subject === "admin") {
    const s = process.env.ADMIN_TOKEN_SECRET;
    if (!s) throw new Error("ADMIN_TOKEN_SECRET missing");
    return s;
  }
  const s = process.env.SECRET_GATE_SIGNING_KEY;
  if (!s) throw new Error("SECRET_GATE_SIGNING_KEY missing");
  return s;
}

/** Read the `Authorization: Bearer <token>` header value. */
export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

/** Returns true if the request has a valid admin bearer token. */
export function requireAdmin(req: Request): boolean {
  return verifyToken(getBearerToken(req), "admin");
}

/** Returns true if the request has a valid secret-gate bearer token. */
export function requireGate(req: Request): boolean {
  return verifyToken(getBearerToken(req), "gate");
}

/** Constant-time string compare (for PIN / secret-date checks). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}