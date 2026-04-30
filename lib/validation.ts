import { isRecord } from "@/lib/utils";
import { TipTapDoc } from "@/lib/types";

const MAX_CONTENT_BYTES = 256 * 1024;

export function parseTitle(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().slice(0, 160);
}

export function validateContentJson(input: unknown): TipTapDoc {
  if (!isRecord(input) || typeof input.type !== "string") {
    throw new Error("Invalid content shape");
  }

  const serialized = JSON.stringify(input);
  if (serialized.length > MAX_CONTENT_BYTES) {
    throw new Error("Content too large");
  }

  return input as TipTapDoc;
}
