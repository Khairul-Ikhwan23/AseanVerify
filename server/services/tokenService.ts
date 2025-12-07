import crypto from "crypto";

export function generateRawToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function computeExpiry(hours: number = 24): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}


