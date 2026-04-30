"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/app/actions";
import { Panel, Input, Button } from "@/components/ui";

const initialState = null;
const authLinkClassName =
  "inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:opacity-95";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Panel className="mx-auto max-w-md p-8">
      <div className="mb-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--foreground-muted)]">TinyNotes</p>
        <h1 className="text-3xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your calm writing space"}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          {mode === "login"
            ? "Use the seeded demo account or create a new one."
            : "Create an account to keep your notes private and scoped to your user."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "register" ? <Input name="name" placeholder="Full name" required /> : null}
        <Input name="email" placeholder="Email" type="email" required />
        <Input name="password" placeholder="Password" type="password" required minLength={8} />
        {mode === "register" ? (
          <Input
            name="confirmPassword"
            placeholder="Confirm password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        ) : null}
        {state?.error ? <p className="text-sm text-[var(--danger)]">{state.error.message}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Working..." : mode === "login" ? "Sign in" : "Register"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm text-[var(--foreground-muted)]">
        {mode === "login" ? (
          <>
            <p>
              Demo account: <code>demo@tinynotes.local</code> / <code>password123</code>
            </p>
            <Link href="/register" className={authLinkClassName}>
              Register
            </Link>
          </>
        ) : (
          <Link href="/login" className={authLinkClassName}>
            Sign in
          </Link>
        )}
      </div>
    </Panel>
  );
}
