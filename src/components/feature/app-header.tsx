"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/lists" className="text-lg font-bold tracking-tight">
          SmartList
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sair da conta"
        >
          <LogOutIcon />
        </Button>
      </div>
    </header>
  );
}
