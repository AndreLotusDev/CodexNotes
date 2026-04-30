import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getOwnedNoteView } from "@/lib/notes";
import { NoteEditor } from "@/components/note-editor";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  const { id } = await params;
  const note = await getOwnedNoteView(user.id, id);

  if (!note) {
    notFound();
  }

  return <NoteEditor mode="edit" note={note} />;
}
