"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createListSchema } from "@/modules/shared/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type FormData = z.infer<typeof createListSchema>;

type Props = {
  mode: "create" | "edit";
  initialTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string) => void;
};

export function ListFormDialog({
  mode,
  initialTitle = "",
  open,
  onOpenChange,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createListSchema),
    defaultValues: { title: initialTitle },
  });

  useEffect(() => {
    if (open) reset({ title: initialTitle });
  }, [open, initialTitle, reset]);

  function onFormSubmit(data: FormData) {
    onSubmit(data.title);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova lista" : "Renomear lista"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="list-title">Nome</Label>
            <Input
              id="list-title"
              autoFocus
              placeholder="Ex: Mercado semanal"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
