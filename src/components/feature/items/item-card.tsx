"use client";

import { useRef, useState } from "react";
import { Trash2Icon, CheckIcon, GripVerticalIcon } from "lucide-react";
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
  onDelete: () => void;
  dragOverlay?: boolean;
  dragHandle?: Record<string, unknown>;
};

const SWIPE_THRESHOLD = 64;
const MAX_SWIPE = 96;
const MOVE_TOLERANCE = 5;

export function ItemCard({ item, onToggle, onDelete, dragOverlay = false, dragHandle }: Props) {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isMoving = useRef(false);
  const gestureHandled = useRef(false);
  const fromGrip = useRef(false);
  const gripRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Ignore touches that originate from the drag handle
    if (gripRef.current?.contains(e.target as Node)) {
      fromGrip.current = true;
      return;
    }
    fromGrip.current = false;

    if (offset !== 0) {
      setTransitioning(true);
      setOffset(0);
      gestureHandled.current = true;
      return;
    }

    startX.current = e.clientX;
    startY.current = e.clientY;
    isMoving.current = false;
    gestureHandled.current = false;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (fromGrip.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isMoving.current && (Math.abs(dx) > MOVE_TOLERANCE || Math.abs(dy) > MOVE_TOLERANCE)) {
      isMoving.current = true;

      if (Math.abs(dy) >= Math.abs(dx)) return; // vertical intent — let browser scroll

      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (!isMoving.current) return;
    if (Math.abs(dy) > Math.abs(dx) + 5) return;

    setTransitioning(false);
    setOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx)));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (fromGrip.current) {
      fromGrip.current = false;
      return;
    }
    if (gestureHandled.current) return;

    const dx = e.clientX - startX.current;

    setTransitioning(true);
    setOffset(0);

    if (!isMoving.current) return;
    isMoving.current = false;

    if (dx >= SWIPE_THRESHOLD) {
      onToggle();
    } else if (dx <= -SWIPE_THRESHOLD) {
      onDelete();
    }
  }

  function handlePointerCancel() {
    fromGrip.current = false;
    isMoving.current = false;
    setTransitioning(true);
    setOffset(0);
  }

  const progress = Math.abs(offset) / MAX_SWIPE;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right swipe reveal — toggle/check */}
      <div
        className="absolute inset-y-0 left-0 flex w-24 items-center justify-start pl-5 rounded-l-xl bg-emerald-500"
        style={{ opacity: offset > 0 ? Math.min(progress * 1.5, 1) : 0 }}
        aria-hidden="true"
      >
        <CheckIcon
          className="size-5 text-white"
          style={{ transform: `scale(${0.6 + progress * 0.6})` }}
        />
      </div>

      {/* Left swipe reveal — delete */}
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-end pr-5 rounded-r-xl bg-red-500"
        style={{ opacity: offset < 0 ? Math.min(progress * 1.5, 1) : 0 }}
        aria-hidden="true"
      >
        <Trash2Icon
          className="size-5 text-white"
          style={{ transform: `scale(${0.6 + progress * 0.6})` }}
        />
      </div>

      {/* Card */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitioning
            ? "transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "none",
        }}
        className={cn(
          "relative flex min-h-[60px] items-center gap-3 rounded-xl border bg-card px-4 py-3",
          "select-none touch-pan-y",
          item.checked && "opacity-70",
          dragOverlay && "shadow-xl ring-1 ring-black/5",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label={`${item.name}${item.quantity > 1 ? `, ${item.quantity} unidades` : ""}${item.checked ? ", comprado" : ""}`}
      >
        {/* Drag handle — only shown for sortable items and the drag overlay */}
        {(dragHandle !== undefined || dragOverlay) && (
          <div
            ref={gripRef}
            {...(dragHandle as React.HTMLAttributes<HTMLDivElement>)}
            style={{ touchAction: "none", cursor: dragOverlay ? "grabbing" : "grab" }}
            className="-ml-1 flex shrink-0 items-center text-muted-foreground/30"
            aria-label="Mover item"
          >
            <GripVerticalIcon className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight text-foreground",
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
      </div>
    </div>
  );
}
