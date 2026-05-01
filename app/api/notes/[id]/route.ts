import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { appError, logServerError } from "@/lib/errors";
import { getSessionUserFromHeaders } from "@/lib/auth";
import { sqliteDb } from "@/lib/db";
import { getOwnedNote } from "@/lib/notes";
import { parseTitle, validateContentJson } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUserFromHeaders(new Headers(request.headers));
    if (!user) {
      return NextResponse.json(appError("UNAUTHORIZED"), { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(appError("VALIDATION_ERROR"), { status: 400 });
    }

    const body = await request.json();
    const patch: { title?: string; contentJson?: ReturnType<typeof validateContentJson> } = {};

    if (typeof body.title !== "undefined") {
      patch.title = parseTitle(body.title);
    }

    if (typeof body.contentJson !== "undefined") {
      patch.contentJson = validateContentJson(body.contentJson);
    }

    const note = sqliteDb.updateNote(user.id, id, patch);
    if (!note) {
      return NextResponse.json(appError("NOT_FOUND"), { status: 404 });
    }

    revalidatePath("/notes");
    revalidatePath(`/notes/${note.id}`);

    const share = sqliteDb.findShareByNoteId(note.id);
    if (share?.enabled) {
      revalidatePath(`/s/${share.token}`);
    }

    return NextResponse.json({
      id: note.id,
      updatedAt: note.updatedAt,
      shareEnabled: note.shareEnabled
    });
  } catch (error) {
    logServerError("PATCH /api/notes/[id]", error);
    return NextResponse.json(appError("INTERNAL_ERROR"), { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUserFromHeaders(new Headers(request.headers));
    if (!user) {
      return NextResponse.json(appError("UNAUTHORIZED"), { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(appError("VALIDATION_ERROR"), { status: 400 });
    }

    const note = await getOwnedNote(user.id, id);
    if (!note) {
      return NextResponse.json(appError("NOT_FOUND"), { status: 404 });
    }

    const share = sqliteDb.findShareByNoteId(note.id);
    const deleted = sqliteDb.deleteNote(user.id, note.id);
    if (!deleted) {
      return NextResponse.json(appError("NOT_FOUND"), { status: 404 });
    }

    revalidatePath("/notes");
    if (share?.token) {
      revalidatePath(`/s/${share.token}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("DELETE /api/notes/[id]", error);
    return NextResponse.json(appError("INTERNAL_ERROR"), { status: 500 });
  }
}
