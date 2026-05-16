"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { forgotPasswordSchema } from "@/modules/shared/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordForm) {
    await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Verifique seu email</h1>
          <p className="text-sm text-muted-foreground">
            Se esse email estiver cadastrado, você receberá as instruções para
            redefinir sua senha em breve.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold">Esqueceu a senha?</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Informe seu email e enviaremos as instruções para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando…" : "Enviar instruções"}
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
