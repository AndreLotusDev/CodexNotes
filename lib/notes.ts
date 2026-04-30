import { sqliteDb } from "@/lib/db";
import { renderTipTapToSanitizedHtml } from "@/lib/tiptap";

export async function listNotesForUser(userId: string) {
  return sqliteDb.listNotes(userId);
}

export async function getOwnedNote(userId: string, noteId: string) {
  return sqliteDb.getNoteById(userId, noteId);
}

export async function getOwnedNoteView(userId: string, noteId: string) {
  const note = sqliteDb.getNoteById(userId, noteId);
  if (!note) return null;

  const share = sqliteDb.findShareByNoteId(noteId);
  return {
    ...note,
    shareToken: share?.enabled ? share.token : null,
    shareUrl: share?.enabled ? `/s/${share.token}` : null,
    renderedHtml: renderTipTapToSanitizedHtml(note.contentJson)
  };
}

export async function getSharedNoteView(token: string) {
  const note = sqliteDb.findSharedNoteByToken(token);
  if (!note) return null;

  return {
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt,
    renderedHtml: renderTipTapToSanitizedHtml(note.contentJson)
  };
}
