import type { ReactNode } from "react";
import { AppHeader } from "@/components/feature/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
