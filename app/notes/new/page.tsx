import { NoteEditor } from "@/components/note-editor";
import { EMPTY_NOTE_DOC, EMPTY_NOTE_TITLE } from "@/lib/note-drafts";

export default async function NewNotePage() {
  return (
    <NoteEditor mode="create" initialTitle={EMPTY_NOTE_TITLE} initialContentJson={EMPTY_NOTE_DOC} />
  );
}
