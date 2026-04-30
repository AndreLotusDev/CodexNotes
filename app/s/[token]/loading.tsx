import { Panel, Shell } from "@/components/ui";

export default function SharedNoteLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <Panel className="h-[420px] animate-pulse bg-[var(--surface-muted)]" />
      </div>
    </Shell>
  );
}
