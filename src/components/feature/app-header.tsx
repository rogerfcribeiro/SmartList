"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  name: string | null | undefined;
  email: string | null | undefined;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Bom dia!";
  if (hour >= 12 && hour < 18) return "Boa tarde!";
  return "Boa noite!";
}

function getInitial(name?: string | null, email?: string | null) {
  return (name ?? email ?? "U").charAt(0).toUpperCase();
}

export function AppHeader({ name, email }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getInitial(name, email)}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{getGreeting()}</p>
            <p className="text-sm font-bold leading-tight">{name ?? email}</p>
          </div>
        </div>

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
