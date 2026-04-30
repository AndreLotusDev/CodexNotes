"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APIError } from "@better-auth/core/error";
import { appError, isActionError, logServerError } from "@/lib/errors";
import { auth, getAuthHeaders, getSessionUser } from "@/lib/auth";
import { sqliteDb } from "@/lib/db";
import { isEmptyUntitledNote } from "@/lib/note-drafts";
import { getOwnedNote } from "@/lib/notes";
import { parseTitle, validateContentJson } from "@/lib/validation";

function mapAuthActionError(error: unknown) {
  if (!(error instanceof APIError)) {
    return null;
  }

  switch (error.statusCode) {
    case 400:
      return appError("VALIDATION_ERROR");
    case 401:
      return appError("UNAUTHORIZED", "Invalid email or password.");
    case 403:
      return appError("FORBIDDEN");
    case 422:
      return appError("CONFLICT", "An account with these details already exists.");
    default:
      return appError("INTERNAL_ERROR");
  }
}

export async function registerAction(_previousState: { error?: { message: string } } | null, formData: FormData) {
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email || !name) {
      return appError("VALIDATION_ERROR", "Name and email are required.");
    }

    if (name.length < 2) {
      return appError("VALIDATION_ERROR", "Please enter your full name.");
    }

    if (password.length < 8) {
      return appError("VALIDATION_ERROR", "Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      return appError("VALIDATION_ERROR", "Passwords do not match.");
    }

    await auth.api.signUpEmail({
      headers: await getAuthHeaders(),
      body: {
        email: email,
        name: name,
        password: password
      }
    });
  } catch (error) {
    const mappedError = mapAuthActionError(error);
    if (mappedError) {
      return mappedError;
    }

    logServerError("registerAction", error);
    return appError("INTERNAL_ERROR");
  }

  redirect("/notes");
}

export async function loginAction(_previousState: { error?: { message: string } } | null, formData: FormData) {
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    await auth.api.signInEmail({
      headers: await getAuthHeaders(),
      body: {
        email: email,
        password: password
      }
    });
  } catch (error) {
    const mappedError = mapAuthActionError(error);
    if (mappedError) {
      return mappedError;
    }

    logServerError("loginAction", error);
    return appError("INTERNAL_ERROR");
  }

  redirect("/notes");
}

export async function logoutAction() {
  await auth.api.signOut({
    headers: await getAuthHeaders()
  });
  redirect("/login");
}

export async function createNoteAction(input: { title?: string; contentJson: object }) {
  try {
    const user = await getSessionUser();
    if (!user) return appError("UNAUTHORIZED");

    const title = parseTitle(input.title);
    const contentJson = validateContentJson(input.contentJson);
    if (isEmptyUntitledNote(title, contentJson)) {
      return appError("VALIDATION_ERROR", "Add a title or some content before creating a note.");
    }

    const note = sqliteDb.createNote(user.id, title, contentJson);

    revalidatePath("/notes");
    return { noteId: note.id };
  } catch (error) {
    logServerError("createNoteAction", error);
    return appError("INTERNAL_ERROR");
  }
}

export async function updateNoteAction(input: { id: string; title?: string; contentJson?: object }) {
  try {
    const user = await getSessionUser();
    if (!user) return appError("UNAUTHORIZED");
    if (!input.id) return appError("VALIDATION_ERROR");

    const patch: { title?: string; contentJson?: ReturnType<typeof validateContentJson> } = {};
    if (typeof input.title !== "undefined") patch.title = parseTitle(input.title);
    if (typeof input.contentJson !== "undefined") patch.contentJson = validateContentJson(input.contentJson);

    const note = sqliteDb.updateNote(user.id, input.id, patch);
    if (!note) return appError("NOT_FOUND");

    revalidatePath("/notes");
    revalidatePath(`/notes/${note.id}`);
    const share = sqliteDb.findShareByNoteId(note.id);
    if (share?.enabled) {
      revalidatePath(`/s/${share.token}`);
    }

    return {
      id: note.id,
      updatedAt: note.updatedAt,
      shareEnabled: note.shareEnabled
    };
  } catch (error) {
    logServerError("updateNoteAction", error);
    return appError("INTERNAL_ERROR");
  }
}

export async function deleteNoteAction(input: { id: string }) {
  try {
    const user = await getSessionUser();
    if (!user) return appError("UNAUTHORIZED");
    if (!input.id) return appError("VALIDATION_ERROR");

    const note = await getOwnedNote(user.id, input.id);
    if (!note) return appError("NOT_FOUND");

    const share = sqliteDb.findShareByNoteId(note.id);
    const deleted = sqliteDb.deleteNote(user.id, note.id);
    if (!deleted) return appError("NOT_FOUND");

    revalidatePath("/notes");
    if (share?.token) {
      revalidatePath(`/s/${share.token}`);
    }
    return { success: true };
  } catch (error) {
    logServerError("deleteNoteAction", error);
    return appError("INTERNAL_ERROR");
  }
}

export async function enableShareAction(input: { id: string }) {
  try {
    const user = await getSessionUser();
    if (!user) return appError("UNAUTHORIZED");
    if (!input.id) return appError("VALIDATION_ERROR");

    const share = sqliteDb.enableShare(user.id, input.id);
    if (!share) return appError("NOT_FOUND");

    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    revalidatePath(`/s/${share.token}`);
    return {
      shareUrl: `/s/${share.token}`,
      token: share.token,
      shareEnabled: true as const
    };
  } catch (error) {
    logServerError("enableShareAction", error);
    return appError("INTERNAL_ERROR");
  }
}

export async function disableShareAction(input: { id: string }) {
  try {
    const user = await getSessionUser();
    if (!user) return appError("UNAUTHORIZED");
    if (!input.id) return appError("VALIDATION_ERROR");

    const share = sqliteDb.findShareByNoteId(input.id);
    const disabled = sqliteDb.disableShare(user.id, input.id);
    if (!disabled) return appError("NOT_FOUND");

    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    if (share?.token) {
      revalidatePath(`/s/${share.token}`);
    }
    return { shareEnabled: false as const };
  } catch (error) {
    logServerError("disableShareAction", error);
    return appError("INTERNAL_ERROR");
  }
}

export async function createNoteAndRedirectAction() {
  redirect("/notes/new");
}
