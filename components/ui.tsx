import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen px-6 py-10 md:px-10">{children}</div>;
}

export function Panel({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/95 p-6 shadow-[var(--shadow)] backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--acc-2)] focus:ring-4 focus:ring-[rgba(95,199,187,0.15)]",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--acc-2)] focus:ring-4 focus:ring-[rgba(95,199,187,0.15)]",
        props.className
      )}
    />
  );
}

export function Button({
  children,
  className,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "ghost" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[linear-gradient(135deg,var(--acc-1),var(--acc-2))] text-white"
      : tone === "danger"
        ? "bg-[var(--danger)] text-white"
        : "bg-[var(--surface-muted)] text-[var(--foreground)]";

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
        toneClass,
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[rgba(47,158,149,0.12)] text-[var(--acc-3)]"
      : tone === "danger"
        ? "bg-[rgba(184,77,101,0.12)] text-[var(--danger)]"
        : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-medium", toneClass)}>{children}</span>;
}
