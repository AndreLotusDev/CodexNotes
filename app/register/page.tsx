import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";
import { Shell } from "@/components/ui";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/notes");
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--foreground-muted)]">A quieter way to write</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">Create an account and keep every note yours.</h1>
          <p className="max-w-xl text-lg text-[var(--foreground-muted)]">
            Your notes stay scoped to your session and user id. Share only when you explicitly enable a link.
          </p>
        </section>
        <AuthForm mode="register" />
      </div>
    </Shell>
  );
}
