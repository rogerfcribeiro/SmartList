import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session) redirect("/lists");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/8 via-background to-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <ShoppingCartIcon className="size-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SmartList</span>
          </Link>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sua lista de compras inteligente
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
