import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Sifre + JWT icin bagimlilik yok: Node'un yerlesik crypto'su.
// (bcrypt native derleme / passport / jsonwebtoken gerektirmez.)

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? "kese-dev-secret-degistir";
}

// --- Sifre hash'leme (scrypt) ---
// Saklanan bicim: "salt:hash" (ikisi de hex).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored ?? "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// --- JWT (HS256, base64url) ---
function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function sign(data: string): string {
  return b64url(createHmac("sha256", jwtSecret()).update(data).digest());
}

export interface JwtPayload {
  sub: string; // userId
  iat: number;
  exp: number;
}

// Token omru: JWT_TTL_HOURS (saat) verilirse o, yoksa 24 saat.
// Kayan oturum (her acilista yenilenir) oldugu icin bu "kullanmayinca cikis" suresidir.
function tokenTtlSeconds(): number {
  const h = Number(process.env.JWT_TTL_HOURS);
  return Number.isFinite(h) && h > 0 ? Math.round(h * 3600) : 24 * 3600;
}

export function signToken(userId: string, ttlSeconds = tokenTtlSeconds()): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = { sub: userId, iat: now, exp: now + ttlSeconds };
  const head = b64urlJson(header);
  const body = b64urlJson(payload);
  const sig = sign(`${head}.${body}`);
  return `${head}.${body}.${sig}`;
}

export function verifyToken(token: string): JwtPayload | null {
  const parts = (token ?? "").split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;

  const expected = sign(`${head}.${body}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as JwtPayload;
    if (!payload.sub || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
