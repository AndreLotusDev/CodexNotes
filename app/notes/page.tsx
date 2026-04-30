import { requireSessionUser } from "@/lib/auth";
import { listNotesForUser } from "@/lib/notes";
import { NoteList } from "@/components/note-list";

export default async function NotesPage() {
  const user = await requireSessionUser();
  const notes = await listNotesForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl">
      <NoteList notes={notes} />
    </div>
  );
}
