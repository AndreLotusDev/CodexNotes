export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ActionError = {
  code: AppErrorCode;
  message: string;
};

export type ActionResult<T> = T | { error: ActionError };

export type TipTapDoc = {
  type: string;
  content?: TipTapDoc[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, string> }>;
  attrs?: Record<string, unknown>;
};

export type NoteRecord = {
  id: string;
  userId: string;
  title: string;
  contentJson: TipTapDoc;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShareRecord = {
  id: string;
  noteId: string;
  token: string;
  tokenHash: string;
  enabled: boolean;
  createdAt: string;
  disabledAt: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};
