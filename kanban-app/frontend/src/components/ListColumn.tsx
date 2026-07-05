import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { List } from "../types";
import CardItem from "./CardItem";

interface Props {
  list: List;
  onAddCard: (listId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function ListColumn({ list, onAddCard, onDeleteCard }: Props) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { setNodeRef } = useDroppable({ id: list.id });

  const sortedCards = [...list.cards].sort((a, b) => a.position - b.position);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle("");
      setIsAdding(false);
    }
  }

  return (
    <div className="w-72 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-700">{list.title}</h3>
        <span className="text-xs text-slate-400">{sortedCards.length}</span>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-2 min-h-[40px]">
        <SortableContext items={sortedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <CardItem key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-2">
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
              if (e.key === "Escape") setIsAdding(false);
            }}
            placeholder="Título de la tarjeta"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 rounded"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-2 text-left text-sm text-slate-500 hover:bg-slate-200 rounded-lg px-2 py-1.5 transition"
        >
          + Agregar tarjeta
        </button>
      )}
    </div>
  );
}
