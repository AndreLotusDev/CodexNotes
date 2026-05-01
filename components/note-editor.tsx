"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useToast } from "@/components/toast-provider";
import { Button, Input, Panel, Badge } from "@/components/ui";
import { EMPTY_NOTE_DOC, isEmptyUntitledNote } from "@/lib/note-drafts";
import { renderTipTapToSanitizedHtml } from "@/lib/tiptap";
import { ActionError, TipTapDoc } from "@/lib/types";

type ExistingNote = {
  note: {
    id: string;
    title: string;
    contentJson: TipTapDoc;
    renderedHtml: string;
    updatedAt: string;
    shareEnabled: boolean;
    shareUrl: string | null;
  };
};

type CreateNote = {
  mode: "create";
  initialTitle?: string;
  initialContentJson?: TipTapDoc;
};

type EditNote = {
  mode: "edit";
} & ExistingNote;

type Props = CreateNote | EditNote;

export function NoteEditor(props: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const isCreateMode = props.mode === "create";
  const noteId = isCreateMode ? null : props.note.id;
  const initialTitle = isCreateMode ? (props.initialTitle ?? "") : props.note.title;
  const initialContentJson = isCreateMode ? (props.initialContentJson ?? EMPTY_NOTE_DOC) : props.note.contentJson;
  const initialPreviewHtml = renderTipTapToSanitizedHtml(initialContentJson);
  const [title, setTitle] = useState(initialTitle);
  const [contentJson, setContentJson] = useState(initialContentJson);
  const [previewHtml, setPreviewHtml] = useState(isCreateMode ? initialPreviewHtml : props.note.renderedHtml);
  const [shareUrl, setShareUrl] = useState(isCreateMode ? null : props.note.shareUrl);
  const [shareEnabled, setShareEnabled] = useState(isCreateMode ? false : props.note.shareEnabled);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSharePending, setIsSharePending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const initialSerialized = JSON.stringify({ title: initialTitle, contentJson: initialContentJson });
  const lastSerialized = useRef(initialSerialized);
  const serialized = JSON.stringify({ title, contentJson });
  const isDirty = serialized !== lastSerialized.current;
  const canCreate = !isEmptyUntitledNote(title, contentJson) && isDirty;

  useEffect(() => {
    if (isCreateMode) {
      return;
    }
    if (!noteId) {
      return;
    }

    if (serialized === lastSerialized.current) {
      return;
    }

    setStatus("saving");
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await requestJson<{ id: string; updatedAt: string; shareEnabled: boolean }>(
          `/api/notes/${noteId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title,
              contentJson
            })
          }
        );

        if ("error" in result) {
          if (result.error.code !== "UNAUTHORIZED") {
            setStatus("error");
            showToast(result.error.message, "error");
            return;
          }

          router.replace("/login");
          return;
        }

        lastSerialized.current = serialized;
        setStatus("saved");
        showToast("Note saved.");
      })();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [contentJson, isCreateMode, noteId, serialized, showToast, title]);

  useEffect(() => {
    if (!isDeleteConfirmOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setIsDeleteConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteConfirmOpen, isDeleting]);

  function handleCreate() {
    if (!canCreate) {
      showToast("Add a title or some content before creating a note.", "error");
      return;
    }

    setIsCreating(true);
    void (async () => {
      const result = await requestJson<{ noteId: string }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title,
          contentJson
        })
      });

      if ("error" in result) {
        setIsCreating(false);

        if (result.error.code !== "UNAUTHORIZED") {
          setStatus("error");
          showToast(result.error.message, "error");
          return;
        }

        router.replace("/login");
        return;
      }

      window.location.assign(`/notes/${result.noteId}?toast=created`);
    })();
  }

  async function handleEnableShare() {
    if (isCreateMode || !noteId) {
      return;
    }

    setIsSharePending(true);
    const result = await requestJson<{ shareUrl: string; token: string; shareEnabled: true }>(`/api/notes/${noteId}/share`, {
      method: "POST"
    });
    if ("error" in result) {
      if (result.error.code === "UNAUTHORIZED") {
        router.replace("/login");
        return;
      }

      setIsSharePending(false);
      setStatus("error");
      showToast(result.error.message, "error");
      return;
    }
    setShareEnabled(true);
    setShareUrl(result.shareUrl);
    setIsSharePending(false);
    showToast("Sharing updated.");
  }

  async function handleDisableShare() {
    if (isCreateMode || !noteId) {
      return;
    }

    setIsSharePending(true);
    const result = await requestJson<{ shareEnabled: false }>(`/api/notes/${noteId}/share`, {
      method: "DELETE"
    });
    if ("error" in result) {
      if (result.error.code === "UNAUTHORIZED") {
        router.replace("/login");
        return;
      }

      setIsSharePending(false);
      setStatus("error");
      showToast(result.error.message, "error");
      return;
    }
    setShareEnabled(false);
    setShareUrl(null);
    setIsSharePending(false);
    showToast("Sharing updated.");
  }

  function handleDeleteRequest() {
    if (isCreateMode || !noteId) {
      return;
    }

    setIsDeleteConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (isCreateMode || !noteId) {
      return;
    }

    setIsDeleting(true);
    const result = await requestJson<{ success: true }>(`/api/notes/${noteId}`, {
      method: "DELETE"
    });
    if ("error" in result) {
      if (result.error.code === "UNAUTHORIZED") {
        router.replace("/login");
        return;
      }

      setIsDeleting(false);
      setStatus("error");
      showToast(result.error.message, "error");
      return;
    }

    setIsDeleteConfirmOpen(false);
    router.push("/notes?toast=deleted");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
      <Panel className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled note" />
          <Badge tone={statusTone(status, isCreating, isCreateMode, canCreate)}>
            {statusLabel(status, isCreating, isCreateMode, canCreate)}
          </Badge>
        </div>

        <RichTextEditor
          content={initialContentJson}
          onChange={(nextContent) => {
            setContentJson(nextContent);
            setPreviewHtml(renderTipTapToSanitizedHtml(nextContent));
          }}
        />

        {isCreateMode ? (
          <div className="flex justify-end">
            <Button type="button" onClick={handleCreate} disabled={isCreating || !canCreate}>
              {isCreating ? "Creating..." : "Create note"}
            </Button>
          </div>
        ) : null}
      </Panel>

      <div className="space-y-6">
        {isCreateMode ? (
          <Panel className="space-y-4">
            <h2 className="text-xl font-semibold">Draft</h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              This draft only becomes a real note after you change the title or add content, then create it.
            </p>
          </Panel>
        ) : (
          <Panel className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Share</h2>
              <Badge tone={shareEnabled ? "success" : "neutral"}>{shareEnabled ? "Enabled" : "Disabled"}</Badge>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Public sharing already behaves like the final flow: enable it, open the token route, and revoke it.
            </p>
            {shareUrl ? (
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4 text-sm">
                <p className="font-medium">Share link</p>
                <p className="mt-2 break-all text-[var(--acc-3)]">{shareUrl}</p>
              </div>
            ) : null}
            <div className="flex gap-3">
              {shareEnabled ? (
                <Button type="button" tone="ghost" onClick={handleDisableShare} disabled={isSharePending}>
                  {isSharePending ? "Updating..." : "Disable share"}
                </Button>
              ) : (
                <Button type="button" onClick={handleEnableShare} disabled={isSharePending}>
                  {isSharePending ? "Updating..." : "Enable share"}
                </Button>
              )}
            </div>
          </Panel>
        )}

        <Panel className="space-y-4">
          <h2 className="text-xl font-semibold">Preview</h2>
          <div
            className="prose-note min-h-40 rounded-2xl bg-[var(--surface-muted)] p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml || initialPreviewHtml }}
          />
        </Panel>

        {isCreateMode ? null : (
          <Panel className="space-y-4">
            <h2 className="text-xl font-semibold">Danger zone</h2>
            <Button type="button" tone="danger" onClick={handleDeleteRequest}>
              Delete note
            </Button>
          </Panel>
        )}
      </div>

      {isDeleteConfirmOpen ? (
        <div
          aria-hidden={isDeleting ? "true" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,24,24,0.48)] px-6"
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteConfirmOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <Panel className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <h2 id="delete-note-title" className="text-2xl font-semibold">
                  Delete this note?
                </h2>
                <p className="text-sm text-[var(--foreground-muted)]">
                  This permanently removes the note and any active share link. This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  tone="ghost"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" tone="danger" disabled={isDeleting} onClick={handleDeleteConfirm}>
                  {isDeleting ? "Deleting..." : "Delete note"}
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusLabel(
  status: "idle" | "saving" | "saved" | "error",
  isCreating: boolean,
  isCreateMode: boolean,
  canCreate: boolean
) {
  if (status === "error") return "Error";
  if (isCreateMode) {
    if (isCreating) return "Creating...";
    return canCreate ? "Ready" : "Unchanged";
  }
  if (status === "saving") return "Saving...";
  if (status === "saved") return "Saved";
  return "Ready";
}

function statusTone(
  status: "idle" | "saving" | "saved" | "error",
  isCreating: boolean,
  isCreateMode: boolean,
  canCreate: boolean
): "neutral" | "success" | "danger" {
  if (status === "error") return "danger";
  if (isCreateMode) {
    if (isCreating) return "neutral";
    return canCreate ? "success" : "neutral";
  }
  return status === "saved" ? "success" : "neutral";
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | { error: ActionError }> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  return response.json() as Promise<T | { error: ActionError }>;
}
