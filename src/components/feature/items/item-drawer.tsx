"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import type { Item } from "./item-card";

const editItemSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(120, "Máximo 120 caracteres"),
  quantity: z.number().int().min(1, "Mínimo 1").max(999, "Máximo 999"),
  category: z.enum([
    "HORTIFRUTI",
    "ACOUGUE",
    "PADARIA",
    "LIMPEZA",
    "HIGIENE",
    "BEBIDAS",
    "OUTROS",
  ]),
});

type EditForm = z.infer<typeof editItemSchema>;

type SaveData = { name: string; quantity: number; category: CategoryKey };

type Props = {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: SaveData) => void;
};

// Inner form remounts (via key) when item changes — no useEffect needed.
function ItemForm({
  item,
  onOpenChange,
  onSave,
}: {
  item: Item;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: SaveData) => void;
}) {
  // Initialize from item prop; remount on key change keeps this fresh.
  const [categoryValue, setCategoryValue] = useState<CategoryKey>(
    item.category,
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: item.name,
      quantity: item.quantity,
      category: item.category,
    },
  });

  function onSubmit(data: EditForm) {
    onSave(item.id, {
      name: data.name,
      quantity: data.quantity,
      category: data.category as CategoryKey,
    });
    onOpenChange(false);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 px-4 pb-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="item-name">Nome</Label>
        <Input
          id="item-name"
          autoComplete="off"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-qty">Quantidade</Label>
        <Input
          id="item-qty"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          aria-invalid={!!errors.quantity}
          {...register("quantity", { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p className="text-xs text-destructive">{errors.quantity.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select
          value={categoryValue}
          onValueChange={(val) => {
            const cat = val as CategoryKey;
            setCategoryValue(cat);
            setValue("category", cat, { shouldValidate: true });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(CATEGORIES) as [
                CategoryKey,
                { label: string; icon: string },
              ][]
            ).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>
                {icon} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DrawerFooter className="px-0">
        <Button type="submit">Salvar</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
      </DrawerFooter>
    </form>
  );
}

export function ItemDrawer({ item, open, onOpenChange, onSave }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar item</DrawerTitle>
        </DrawerHeader>
        {item ? (
          <ItemForm
            key={item.id}
            item={item}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
