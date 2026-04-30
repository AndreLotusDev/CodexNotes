import { ReactNode } from "react";
import { requireSessionUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { Shell } from "@/components/ui";

export default async function NotesLayout({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();

  return (
    <Shell>
      <div className="mx-auto max-w-6xl">
        <AppHeader user={user} />
        {children}
      </div>
    </Shell>
  );
}
