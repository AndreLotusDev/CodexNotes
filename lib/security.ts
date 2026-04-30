import { createHash, randomBytes } from "crypto";

export function createId() {
  return randomBytes(16).toString("hex");
}

export function createShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
