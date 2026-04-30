import Link from "next/link";
import { Badge, Panel } from "@/components/ui";
import { NoteRecord } from "@/lib/types";

export function NoteList({ notes }: { notes: NoteRecord[] }) {
  if (notes.length === 0) {
    return (
      <Panel className="p-10 text-center">
        <h2 className="text-2xl font-semibold">No notes yet</h2>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Start with a blank page and we will wire real persistence underneath it next.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      {notes.map((note) => (
        <Link key={note.id} href={`/notes/${note.id}`}>
          <Panel className="transition hover:-translate-y-0.5 hover:border-[var(--acc-1)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{note.title || "Untitled note"}</h2>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">Updated {formatDate(note.updatedAt)}</p>
              </div>
              <Badge tone={note.shareEnabled ? "success" : "neutral"}>
                {note.shareEnabled ? "Shared" : "Private"}
              </Badge>
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
