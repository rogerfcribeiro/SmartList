"use client";

import { useRef, useState } from "react";
import { PencilIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/utils";

export type Item = {
  id: string;
  name: string;
  quantity: number;
  category: CategoryKey;
  checked: boolean;
  createdAt: string;
};

type Props = {
  item: Item;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const SWIPE_THRESHOLD = 55;
const DELETE_WIDTH = 80;
const LONG_PRESS_MS = 500;

export function ItemCard({ item, onToggle, onEdit, onDelete }: Props) {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const gestureHandled = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // If already swiped open, close on next tap
    if (offset !== 0) {
      setTransitioning(true);
      setOffset(0);
      return;
    }

    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = false;
    gestureHandled.current = false;

    e.currentTarget.setPointerCapture(e.pointerId);

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      if (!isDragging.current) {
        gestureHandled.current = true;
        onEdit();
      }
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isDragging.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isDragging.current = true;
      clearLongPress();
    }

    if (!isDragging.current) return;
    // Ignore if primarily vertical (let scroll handle it)
    if (Math.abs(dy) > Math.abs(dx) + 5) return;

    const newOffset = Math.max(-DELETE_WIDTH, Math.min(0, dx));
    setTransitioning(false);
    setOffset(newOffset);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    clearLongPress();

    if (gestureHandled.current) return;

    const dx = e.clientX - startX.current;

    setTransitioning(true);

    if (!isDragging.current) {
      // Plain tap → toggle
      setOffset(0);
      onToggle();
      return;
    }

    isDragging.current = false;

    if (dx < -SWIPE_THRESHOLD) {
      setOffset(-DELETE_WIDTH);
    } else {
      setOffset(0);
    }
  }

  function handlePointerCancel() {
    clearLongPress();
    isDragging.current = false;
    setTransitioning(true);
    setOffset(0);
  }

  const category = CATEGORIES[item.category] ?? CATEGORIES.OUTROS;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete reveal zone */}
      <div
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-xl bg-destructive"
        aria-hidden="true"
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            setTransitioning(true);
            setOffset(0);
            onDelete();
          }}
          className="text-xs font-semibold text-white"
        >
          Excluir
        </button>
      </div>

      {/* Card */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitioning ? "transform 200ms ease" : "none",
        }}
        className={cn(
          "relative flex min-h-[60px] items-center gap-3 rounded-xl border bg-card px-4 py-3",
          "cursor-pointer select-none touch-pan-y",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        role="checkbox"
        aria-checked={item.checked}
        aria-label={item.name}
      >
        <Checkbox
          checked={item.checked}
          className="pointer-events-none shrink-0"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {item.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {category.icon} {category.label}
            {item.quantity > 1 && <> · {item.quantity} unid.</>}
          </p>
        </div>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Editar ${item.name}`}
        >
          <PencilIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
