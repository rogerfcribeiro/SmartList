"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";
import { ListCard, type ListSummary } from "@/components/feature/list-card";
import { ListFormDialog } from "@/components/feature/list-form-dialog";
import { DeleteListDialog } from "@/components/feature/delete-list-dialog";

async function fetchLists(): Promise<ListSummary[]> {
  const res = await fetch("/api/v1/lists");
  if (!res.ok) throw new Error("Falha ao carregar listas.");
  return res.json();
}

async function createList(title: string): Promise<ListSummary> {
  const res = await fetch("/api/v1/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Erro ao criar lista.");
  }
  return res.json();
}

async function updateList(id: string, title: string): Promise<ListSummary> {
  const res = await fetch(`/api/v1/lists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Erro ao renomear lista.");
  return res.json();
}

async function deleteList(id: string): Promise<void> {
  const res = await fetch(`/api/v1/lists/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao excluir lista.");
}

const LISTS_KEY = ["lists"] as const;

function optimisticCreate(title: string): ListSummary {
  return {
    id: `optimistic-${Date.now()}`,
    title,
    totalItems: 0,
    checkedItems: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ListsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListSummary | null>(null);
  const [deletingList, setDeletingList] = useState<ListSummary | null>(null);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: LISTS_KEY,
    queryFn: fetchLists,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createList(title),
    onMutate: async (title) => {
      setCreateOpen(false);
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });
      const previous = queryClient.getQueryData<ListSummary[]>(LISTS_KEY);
      queryClient.setQueryData<ListSummary[]>(LISTS_KEY, (old) => [
        optimisticCreate(title),
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(LISTS_KEY, ctx?.previous);
      toast.error("Erro ao criar lista. Tente novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateList(id, title),
    onMutate: async ({ id, title }) => {
      setEditingList(null);
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });
      const previous = queryClient.getQueryData<ListSummary[]>(LISTS_KEY);
      queryClient.setQueryData<ListSummary[]>(LISTS_KEY, (old) =>
        old?.map((l) => (l.id === id ? { ...l, title } : l)) ?? []
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(LISTS_KEY, ctx?.previous);
      toast.error("Erro ao renomear lista. Tente novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteList(id),
    onMutate: async (id) => {
      setDeletingList(null);
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });
      const previous = queryClient.getQueryData<ListSummary[]>(LISTS_KEY);
      queryClient.setQueryData<ListSummary[]>(LISTS_KEY, (old) =>
        old?.filter((l) => l.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(LISTS_KEY, ctx?.previous);
      toast.error("Erro ao excluir lista. Tente novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });

  function handleCreate(title: string) {
    createMutation.mutate(title);
  }

  function handleEdit(title: string) {
    if (!editingList) return;
    editMutation.mutate({ id: editingList.id, title });
  }

  function handleDelete() {
    if (!deletingList) return;
    deleteMutation.mutate(deletingList.id);
  }

  return (
    <>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Minhas listas</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-20 rounded-xl border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCartIcon className="size-9 text-primary/70" />
            </div>
            <p className="text-base font-semibold text-foreground">
              Nenhuma lista ainda
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Toque no botão + para criar sua primeira lista.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list, index) => (
              <div
                key={list.id}
                className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-300"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ListCard
                  list={list}
                  onEdit={() => setEditingList(list)}
                  onDelete={() => setDeletingList(list)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Nova lista"
      >
        <PlusIcon className="size-6" />
      </button>

      {/* Create dialog */}
      <ListFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <ListFormDialog
        key={editingList?.id ?? "edit"}
        mode="edit"
        initialTitle={editingList?.title}
        open={!!editingList}
        onOpenChange={(open) => !open && setEditingList(null)}
        onSubmit={handleEdit}
      />

      {/* Delete confirmation */}
      {deletingList && (
        <DeleteListDialog
          title={deletingList.title}
          open
          onOpenChange={(open) => !open && setDeletingList(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
