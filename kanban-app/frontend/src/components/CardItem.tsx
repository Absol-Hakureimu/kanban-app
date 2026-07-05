import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";

interface Props {
  card: Card;
  onDelete: (cardId: string) => void;
}

export default function CardItem({ card, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{card.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs transition"
        >
          ✕
        </button>
      </div>
      {card.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.description}</p>
      )}
      {card.assignees.length > 0 && (
        <div className="flex -space-x-1 mt-2">
          {card.assignees.map((a) => (
            <div
              key={a.id}
              title={a.user.name}
              className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-medium flex items-center justify-center border-2 border-white"
            >
              {a.user.name.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
