import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { appError, logServerError } from "@/lib/errors";
import { getSessionUserFromHeaders } from "@/lib/auth";
import { sqliteDb } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUserFromHeaders(new Headers(request.headers));
    if (!user) {
      return NextResponse.json(appError("UNAUTHORIZED"), { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(appError("VALIDATION_ERROR"), { status: 400 });
    }

    const share = sqliteDb.enableShare(user.id, id);
    if (!share) {
      return NextResponse.json(appError("NOT_FOUND"), { status: 404 });
    }

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    revalidatePath(`/s/${share.token}`);

    return NextResponse.json({
      shareUrl: `/s/${share.token}`,
      token: share.token,
      shareEnabled: true
    });
  } catch (error) {
    logServerError("POST /api/notes/[id]/share", error);
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

    const share = sqliteDb.findShareByNoteId(id);
    const disabled = sqliteDb.disableShare(user.id, id);
    if (!disabled) {
      return NextResponse.json(appError("NOT_FOUND"), { status: 404 });
    }

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    if (share?.token) {
      revalidatePath(`/s/${share.token}`);
    }

    return NextResponse.json({ shareEnabled: false });
  } catch (error) {
    logServerError("DELETE /api/notes/[id]/share", error);
    return NextResponse.json(appError("INTERNAL_ERROR"), { status: 500 });
  }
}
