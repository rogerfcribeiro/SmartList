import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session) redirect("/lists");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight">
            SmartList
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua lista de compras inteligente
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
