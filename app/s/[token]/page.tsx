import { notFound } from "next/navigation";
import { getSharedNoteView } from "@/lib/notes";
import { Panel, Shell } from "@/components/ui";

export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const note = await getSharedNoteView(token);

  if (!note) {
    notFound();
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <Panel className="p-8">
          <div className="h-1.5 w-24 animate-pulse rounded-full bg-[rgba(95,199,187,0.35)]" />
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Shared note</p>
          <h1 className="mt-3 text-4xl font-semibold">{note.title || "Untitled note"}</h1>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">Updated {formatDate(note.updatedAt)}</p>
          <div className="prose-note mt-8" dangerouslySetInnerHTML={{ __html: note.renderedHtml }} />
        </Panel>
      </div>
    </Shell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
