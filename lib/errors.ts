import { ActionError, AppErrorCode } from "@/lib/types";

const GENERIC_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHORIZED: "You need to sign in to continue.",
  FORBIDDEN: "You do not have access to this resource.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  VALIDATION_ERROR: "Please review your input and try again.",
  CONFLICT: "This change could not be completed right now.",
  INTERNAL_ERROR: "Something went wrong. Please try again."
};

export function appError(code: AppErrorCode, message = GENERIC_MESSAGES[code]): { error: ActionError } {
  return { error: { code, message } };
}

export function isActionError<T>(value: T | { error: ActionError }): value is { error: ActionError } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
