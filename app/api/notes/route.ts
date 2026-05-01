import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { appError, logServerError } from "@/lib/errors";
import { getSessionUserFromHeaders } from "@/lib/auth";
import { sqliteDb } from "@/lib/db";
import { isEmptyUntitledNote } from "@/lib/note-drafts";
import { parseTitle, validateContentJson } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await getSessionUserFromHeaders(new Headers(request.headers));
    if (!user) {
      return NextResponse.json(appError("UNAUTHORIZED"), { status: 401 });
    }

    const body = await request.json();
    const title = parseTitle(body.title);
    const contentJson = validateContentJson(body.contentJson);

    if (isEmptyUntitledNote(title, contentJson)) {
      return NextResponse.json(appError("VALIDATION_ERROR", "Add a title or some content before creating a note."), {
        status: 400
      });
    }

    const note = sqliteDb.createNote(user.id, title, contentJson);
    revalidatePath("/notes");

    return NextResponse.json({ noteId: note.id });
  } catch (error) {
    logServerError("POST /api/notes", error);
    return NextResponse.json(appError("INTERNAL_ERROR"), { status: 500 });
  }
}
