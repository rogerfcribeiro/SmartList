import Link from "next/link";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type ListSummary = {
  id: string;
  title: string;
  totalItems: number;
  checkedItems: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  list: ListSummary;
  onEdit: () => void;
  onDelete: () => void;
};

export function ListCard({ list, onEdit, onDelete }: Props) {
  const pct =
    list.totalItems > 0
      ? Math.round((list.checkedItems / list.totalItems) * 100)
      : 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <Link
          href={`/lists/${list.id}`}
          className="min-w-0 flex-1"
          aria-label={`Abrir lista ${list.title}`}
        >
          <p className="truncate font-semibold text-foreground">{list.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {list.checkedItems} de {list.totalItems}{" "}
            {list.totalItems === 1 ? "item" : "itens"}
          </p>
        </Link>

        <div className="flex shrink-0 items-center">
          {list.totalItems > 0 && (
            <span
              className={
                pct === 100
                  ? "mr-1 text-xs font-semibold text-primary"
                  : "mr-1 text-xs text-muted-foreground"
              }
            >
              {pct}%
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Editar nome da lista"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Excluir lista"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      {list.totalItems > 0 && (
        <div className="mt-3">
          <Progress value={pct} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
