"use client";

import { useRef, useState } from "react";
import { PencilIcon, Trash2Icon, GripVerticalIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoryKey } from "@/lib/categories";

export type Item = {
  id: string;
  name: string;
  quantity: number;
  category: CategoryKey;
  checked: boolean;
  order: number;
  createdAt: string;
};

type Props = {
  item: Item;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleListeners?: Record<string, unknown>;
};

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 80;

export function ItemCard({ item, onToggle, onEdit, onDelete, dragHandleListeners }: Props) {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const gestureHandled = useRef(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (offset !== 0) {
      setTransitioning(true);
      setOffset(0);
      gestureHandled.current = true;
      return;
    }
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = false;
    gestureHandled.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isDragging.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isDragging.current = true;
    }
    if (!isDragging.current) return;
    if (Math.abs(dy) > Math.abs(dx) + 5) return;

    setTransitioning(false);
    setOffset(Math.max(-MAX_SWIPE, Math.min(0, dx)));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (gestureHandled.current) return;

    const dx = e.clientX - startX.current;
    setTransitioning(true);
    setOffset(0);

    if (!isDragging.current) return;
    isDragging.current = false;

    if (dx < -SWIPE_THRESHOLD) {
      onToggle();
    }
  }

  function handlePointerCancel() {
    isDragging.current = false;
    setTransitioning(true);
    setOffset(0);
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Toggle reveal zone */}
      <div
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-xl bg-green-500"
        aria-hidden="true"
      >
        <CheckIcon className="size-5 text-white" />
      </div>

      {/* Card */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitioning ? "transform 200ms ease" : "none",
        }}
        className={cn(
          "relative flex min-h-[60px] items-center gap-2 rounded-xl border bg-card px-3 py-3",
          "select-none touch-pan-y",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Drag handle */}
        {dragHandleListeners && (
          <button
            {...(dragHandleListeners as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (dragHandleListeners.onPointerDown as React.PointerEventHandler<HTMLButtonElement>)?.(e);
            }}
            className="shrink-0 touch-none cursor-grab text-muted-foreground/40 active:cursor-grabbing hover:text-muted-foreground"
            aria-label="Arrastar para reordenar"
          >
            <GripVerticalIcon className="size-4" />
          </button>
        )}

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {item.name}
            {item.quantity > 1 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                × {item.quantity}
              </span>
            )}
          </p>
        </div>

        {/* Edit + Delete */}
        <div
          className="flex shrink-0 items-center"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit()}
            aria-label={`Editar ${item.name}`}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete()}
            aria-label={`Excluir ${item.name}`}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    </div>
  );
}
