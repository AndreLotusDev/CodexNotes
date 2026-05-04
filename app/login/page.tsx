import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";
import { Shell } from "@/components/ui";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/notes");
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Minimal black interface</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            Notes with a calm surface and proper user ownership underneath.
          </h1>
          <p className="max-w-xl text-lg text-[var(--foreground-muted)]">
            Sign in to reach your own notes, keep CRUD scoped to your account, and share individual notes only when you
            choose to.
          </p>
        </section>
        <AuthForm mode="login" />
      </div>
    </Shell>
  );
}
