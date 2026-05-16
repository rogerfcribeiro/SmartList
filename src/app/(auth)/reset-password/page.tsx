"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { resetPasswordSchema } from "@/modules/shared/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  if (!token) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
        <p className="text-sm text-destructive">
          Link inválido ou expirado.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  async function onSubmit(data: ResetForm) {
    setServerError(null);
    const res = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/login?reset=1");
      return;
    }

    const body = await res.json().catch(() => ({}));
    setServerError(
      body?.error?.message ?? "Erro ao redefinir senha. O link pode ter expirado."
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold">Nova senha</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse h-64" />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
