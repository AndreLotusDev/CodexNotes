"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SessionUser } from "@/lib/types";

export function AppHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const showAllNotesLink = pathname !== "/notes";

  async function handleSignOut() {
    setIsSigningOut(true);
    void fetch("/api/auth/sign-out", {
      method: "POST",
      keepalive: true
    });
  }

  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--foreground-muted)]">TinyNotes</p>
        <h1 className="text-3xl font-semibold">A quieter home for your notes</h1>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-[var(--foreground-muted)] md:block">{user.name}</p>
        {showAllNotesLink ? (
          <Link
            href="/notes"
            prefetch={false}
            className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)]"
          >
            All notes
          </Link>
        ) : null}
        <Link
          href="/notes/new"
          prefetch={false}
          className="inline-flex items-center rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--acc-3)] ring-1 ring-[var(--border)]"
        >
          New note
        </Link>
        <Link
          href="/login"
          prefetch={false}
          onClick={() => void handleSignOut()}
          className="inline-flex items-center justify-center rounded-full bg-[var(--surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:opacity-95"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Link>
      </div>
    </header>
  );
}
