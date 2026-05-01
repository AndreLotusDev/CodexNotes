import { requireSessionUser } from "@/lib/auth";
import { listNotesForUser } from "@/lib/notes";
import { NoteList } from "@/components/note-list";

export default async function NotesPage() {
  const user = await requireSessionUser();
  const notes = await listNotesForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <div className="h-1.5 w-24 animate-pulse rounded-full bg-[rgba(95,199,187,0.35)]" />
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Workspace</p>
        <h2 className="text-3xl font-semibold">Welcome to TinyNotes</h2>
        <p className="text-sm text-[var(--foreground-muted)]">Your notes stay private until you decide to share one.</p>
      </div>
      <NoteList notes={notes} />
    </div>
  );
}
