import Link from "next/link";
import { Button, Panel, Shell } from "@/components/ui";

export default function NotFound() {
  return (
    <Shell>
      <div className="mx-auto max-w-2xl pt-20">
        <Panel className="space-y-5 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--foreground-muted)]">404</p>
          <h1 className="text-4xl font-semibold">This page drifted out of reach.</h1>
          <p className="text-[var(--foreground-muted)]">
            Missing notes, revoked shares, and unknown routes all land here without exposing any extra detail.
          </p>
          <div className="flex justify-center">
            <Link href="/notes">
              <Button>Back to notes</Button>
            </Link>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
