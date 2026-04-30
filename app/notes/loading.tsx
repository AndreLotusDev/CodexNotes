import { Panel, Shell } from "@/components/ui";

export default function NotesLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-4">
        {[0, 1, 2].map((item) => (
          <Panel key={item} className="h-28 animate-pulse bg-[var(--surface-muted)]" />
        ))}
      </div>
    </Shell>
  );
}
