import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 bg-muted/40">
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
