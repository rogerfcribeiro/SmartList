"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon, ShoppingCartIcon } from "lucide-react";
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
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getInitial(name, email)}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{getGreeting()}</p>
            <p className="text-sm font-bold leading-tight text-foreground">
              {name ?? email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            <ShoppingCartIcon className="size-4" />
            SmartList
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair da conta"
            className="ml-1 text-muted-foreground"
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
