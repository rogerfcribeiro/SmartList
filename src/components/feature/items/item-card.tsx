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
};

const SWIPE_THRESHOLD = 64;
const MAX_SWIPE = 96;
const LONG_PRESS_MS = 250;       // must match dnd-kit sensor delay
const LONG_PRESS_FEEDBACK_MS = 150; // visual feedback starts slightly before activation
const MOVE_TOLERANCE = 5;

export function ItemCard({ item, onToggle, onDelete, dragOverlay = false }: Props) {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [longPressing, setLongPressing] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isMoving = useRef(false);
  const gestureHandled = useRef(false);
  const isDragGesture = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (feedbackTimer.current !== null) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    setLongPressing(false);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // dnd-kit's onPointerDown is on the outer wrapper and fires via event bubbling.
    // We only handle swipe + long-press feedback here.
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
    isDragGesture.current = false;

    // Visual feedback: card "lifts" slightly before drag activates
    feedbackTimer.current = setTimeout(() => {
      setLongPressing(true);
      feedbackTimer.current = null;
    }, LONG_PRESS_FEEDBACK_MS);

    // Sync with dnd-kit sensor delay — suppress tap/swipe after this fires
    longPressTimer.current = setTimeout(() => {
      isDragGesture.current = true;
      setLongPressing(false); // dnd-kit DragOverlay takes over visually
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isDragGesture.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isMoving.current && (Math.abs(dx) > MOVE_TOLERANCE || Math.abs(dy) > MOVE_TOLERANCE)) {
      isMoving.current = true;
      clearTimers(); // movement detected — cancel long-press

      if (Math.abs(dy) >= Math.abs(dx)) return; // vertical intent — let browser scroll

      // Horizontal swipe confirmed — capture pointer for reliable tracking
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (!isMoving.current) return;
    if (Math.abs(dy) > Math.abs(dx) + 5) return;

    setTransitioning(false);
    setOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx)));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    clearTimers();

    if (gestureHandled.current) return;

    const dx = e.clientX - startX.current;

    setTransitioning(true);
    setOffset(0);

    if (isDragGesture.current) {
      isDragGesture.current = false;
      return;
    }

    if (!isMoving.current) return; // tap — no action

    isMoving.current = false;

    if (dx >= SWIPE_THRESHOLD) {
      onToggle();
    } else if (dx <= -SWIPE_THRESHOLD) {
      onDelete();
    }
  }

  function handlePointerCancel() {
    clearTimers();
    isMoving.current = false;
    isDragGesture.current = false;
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
          transform: `translateX(${offset}px) scale(${longPressing ? 1.04 : 1})`,
          transition: transitioning
            ? "transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : longPressing
            ? "transform 200ms ease-out, box-shadow 200ms ease-out"
            : "none",
          boxShadow: longPressing
            ? "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)"
            : undefined,
        }}
        className={cn(
          "relative flex min-h-[60px] items-center gap-3 rounded-xl border bg-card px-4 py-3",
          "select-none touch-pan-y cursor-grab active:cursor-grabbing",
          item.checked && "opacity-70",
          longPressing && "ring-2 ring-primary/25",
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
        {/* Grip indicator — fades in on long press, stays visible in drag overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-150",
            longPressing || dragOverlay ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        >
          <GripVerticalIcon className="size-5 text-foreground/25" />
        </div>

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
      </div>
    </div>
  );
}
