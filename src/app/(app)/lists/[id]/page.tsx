"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, PackageOpenIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemCard, type Item } from "@/components/feature/items/item-card";
import type { CategoryKey } from "@/lib/categories";

// ─── API ────────────────────────────────────────────────────────────────────

type ListDetail = { id: string; title: string };
type ItemUpdateData = {
  name?: string;
  quantity?: number;
  category?: CategoryKey;
  checked?: boolean;
  order?: number;
};

async function fetchList(id: string): Promise<ListDetail> {
  const res = await fetch(`/api/v1/lists/${id}`);
  if (!res.ok) throw new Error("Lista não encontrada.");
  return res.json();
}

async function fetchItems(listId: string): Promise<Item[]> {
  const res = await fetch(`/api/v1/lists/${listId}/items`);
  if (!res.ok) throw new Error("Falha ao carregar itens.");
  return res.json();
}

async function apiCreateItem(listId: string, name: string): Promise<Item> {
  const res = await fetch(`/api/v1/lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, quantity: 1, category: "OUTROS" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Erro ao adicionar item.");
  }
  return res.json();
}

async function apiUpdateItem(itemId: string, data: ItemUpdateData): Promise<Item> {
  const res = await fetch(`/api/v1/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar item.");
  return res.json();
}

async function apiDeleteItem(itemId: string): Promise<void> {
  const res = await fetch(`/api/v1/items/${itemId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao excluir item.");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ITEM_LIMIT = 200;

function makeOptimisticItem(name: string): Item {
  return {
    id: `optimistic-${Date.now()}`,
    name,
    quantity: 1,
    category: "OUTROS",
    checked: false,
    order: 0,
    createdAt: new Date().toISOString(),
  };
}

// ─── Sortable item card ───────────────────────────────────────────────────────

type SortableItemCardProps = {
  item: Item;
  onToggle: () => void;
  onDelete: () => void;
};

function SortableItemCard({ item, onToggle, onDelete }: SortableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : "auto",
      }}
    >
      <ItemCard
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        dragListeners={listeners}
        dragAttributes={attributes as unknown as Record<string, unknown>}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState("");
  const [userDragOrder, setUserDragOrder] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // pending deletes: itemId → timeout handle
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // IDs optimistically hidden while the 5-second undo window is open
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const LIST_KEY = ["list", id] as const;
  const ITEMS_KEY = ["items", id] as const;

  const { data: list } = useQuery({
    queryKey: LIST_KEY,
    queryFn: () => fetchList(id),
  });

  const { data: rawItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => fetchItems(id),
  });

  // Derive ordered pending IDs during render — preserves user drag order, drops removed, appends new
  const localPendingIds = useMemo(() => {
    const serverPendingIds = rawItems.filter((i) => !i.checked).map((i) => i.id);
    if (userDragOrder.length === 0) return serverPendingIds;
    const serverSet = new Set(serverPendingIds);
    const prevSet = new Set(userDragOrder);
    const kept = userDragOrder.filter((id) => serverSet.has(id));
    const added = serverPendingIds.filter((id) => !prevSet.has(id));
    return [...kept, ...added];
  }, [rawItems, userDragOrder]);

  // Hide items that are in the undo-delete window
  const items = rawItems.filter((i) => !deletedIds.has(i.id));
  const orderedPendingItems = localPendingIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is Item => i !== undefined && !i.checked);
  const checkedItems = items.filter((i) => i.checked);
  const totalItems = orderedPendingItems.length + checkedItems.length;
  const completedCount = checkedItems.length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const isAtLimit = rawItems.length >= ITEM_LIMIT;

  // Autofocus only when list is empty (ADR-006)
  useEffect(() => {
    if (!itemsLoading && rawItems.length === 0) {
      inputRef.current?.focus();
    }
  }, [itemsLoading, rawItems.length]);

  // ── Add item ──────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: (name: string) => apiCreateItem(id, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<Item[]>(ITEMS_KEY);
      queryClient.setQueryData<Item[]>(ITEMS_KEY, (old) => [
        ...(old ?? []),
        makeOptimisticItem(name),
      ]);
      return { previous };
    },
    onError: (err, _, ctx) => {
      queryClient.setQueryData(ITEMS_KEY, ctx?.previous);
      const msg = err instanceof Error ? err.message : "Erro ao adicionar item.";
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  // ── Toggle checked ────────────────────────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      apiUpdateItem(itemId, { checked }),
    onMutate: async ({ itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<Item[]>(ITEMS_KEY);
      queryClient.setQueryData<Item[]>(ITEMS_KEY, (old) =>
        old?.map((i) => (i.id === itemId ? { ...i, checked } : i)) ?? [],
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(ITEMS_KEY, ctx?.previous);
      toast.error("Erro ao atualizar item. Tente novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  // ── Delete with undo ──────────────────────────────────────────────────────

  function handleDeleteItem(item: Item) {
    // Optimistically hide item
    setDeletedIds((prev) => new Set([...prev, item.id]));

    const toastId = toast("Item removido.", {
      duration: 5000,
      action: {
        label: "Desfazer",
        onClick: () => {
          const timer = pendingDeletes.current.get(item.id);
          if (timer) {
            clearTimeout(timer);
            pendingDeletes.current.delete(item.id);
          }
          // Restore item
          setDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          toast.dismiss(toastId);
        },
      },
    });

    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(item.id);
      try {
        await apiDeleteItem(item.id);
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
        queryClient.invalidateQueries({ queryKey: ["lists"] });
      } catch {
        // Restore on error
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        toast.error("Erro ao excluir item. Tente novamente.");
      }
    }, 5000);

    pendingDeletes.current.set(item.id, timer);
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const [activeItem, setActiveItem] = useState<Item | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = localPendingIds.indexOf(active.id as string);
    const newIdx = localPendingIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;

    const newIds = arrayMove(localPendingIds, oldIdx, newIdx);
    setUserDragOrder(newIds);

    newIds.forEach((itemId, idx) => {
      apiUpdateItem(itemId, { order: idx }).catch(() => {});
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAddItem() {
    const name = inputValue.trim();
    if (!name) return;
    if (isAtLimit) {
      toast.error("Lista cheia (200 itens).");
      return;
    }
    setInputValue("");
    addMutation.mutate(name);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/lists")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
          aria-label="Voltar para listas"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <h1 className="flex-1 truncate text-lg font-semibold">
          {list?.title ?? "Lista"}
        </h1>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {completedCount} de {totalItems}{" "}
              {totalItems === 1 ? "item" : "itens"}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Quick-add input */}
      <div className="mb-5 flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar item…"
          disabled={isAtLimit}
          autoComplete="off"
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleAddItem}
          disabled={!inputValue.trim() || isAtLimit}
          aria-label="Adicionar item"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      {/* Items */}
      {itemsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[60px] animate-pulse rounded-xl border bg-card"
            />
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpenIcon className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhum item ainda. Adicione acima.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending */}
          {orderedPendingItems.length > 0 && (
            <section aria-label="Pendentes" className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pendentes ({orderedPendingItems.length})
              </h2>
              <DndContext
                sensors={sensors}
                onDragStart={(event) => {
                  const dragged = items.find((i) => i.id === event.active.id);
                  setActiveItem(dragged ?? null);
                }}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveItem(null)}
              >
                <SortableContext
                  items={localPendingIds}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedPendingItems.map((item) => (
                    <SortableItemCard
                      key={item.id}
                      item={item}
                      onToggle={() =>
                        toggleMutation.mutate({ itemId: item.id, checked: true })
                      }
                      onDelete={() => handleDeleteItem(item)}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeItem && (
                    <ItemCard
                      item={activeItem}
                      onToggle={() => {}}
                      onDelete={() => {}}
                      dragOverlay
                    />
                  )}
                </DragOverlay>
              </DndContext>
            </section>
          )}

          {/* Comprados */}
          {checkedItems.length > 0 && (
            <section aria-label="Comprados" className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comprados ({checkedItems.length})
              </h2>
              {checkedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggle={() =>
                    toggleMutation.mutate({ itemId: item.id, checked: false })
                  }
                  onDelete={() => handleDeleteItem(item)}
                />
              ))}
            </section>
          )}
        </div>
      )}

    </>
  );
}
