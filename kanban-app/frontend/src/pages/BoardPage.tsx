import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { fetchBoard, createList as createListApi, createCard as createCardApi, moveCard as moveCardApi, deleteCard as deleteCardApi } from "../api/boards";
import { useBoardStore } from "../store/boardStore";
import { useSocket } from "../hooks/useSocket";
import ListColumn from "../components/ListColumn";
import CardItem from "../components/CardItem";
import type { Card } from "../types";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, setBoard, addCard, moveCardLocal, removeCard } = useBoardStore();
  const [newListTitle, setNewListTitle] = useState("");
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  useSocket(boardId);

  useEffect(() => {
    if (!boardId) return;
    fetchBoard(boardId).then(setBoard);
  }, [boardId, setBoard]);

  if (!board) {
    return <div className="p-8 text-slate-500 text-sm">Cargando tablero...</div>;
  }

  const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);

  async function handleAddList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;
    await createListApi(boardId, newListTitle.trim());
    setNewListTitle("");
  }

  async function handleAddCard(listId: string, title: string) {
    if (!boardId) return;
    const card = await createCardApi(boardId, listId, { title });
    addCard(card);
  }

  async function handleDeleteCard(cardId: string) {
    if (!boardId) return;
    removeCard(cardId);
    await deleteCardApi(boardId, cardId);
  }

  function handleDragStart(event: DragStartEvent) {
    const card = board?.lists.flatMap((l) => l.cards).find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !boardId) return;

    const activeCardId = active.id as string;
    const currentCard = board?.lists.flatMap((l) => l.cards).find((c) => c.id === activeCardId);
    if (!currentCard) return;

    // El "over" puede ser otra tarjeta (misma o distinta lista) o directamente una columna vacía
    const overList = board?.lists.find((l) => l.id === over.id);
    const overCard = board?.lists.flatMap((l) => l.cards).find((c) => c.id === over.id);

    const targetListId = overList?.id ?? overCard?.listId ?? currentCard.listId;
    const targetList = board?.lists.find((l) => l.id === targetListId);
    const targetPosition = overCard
      ? targetList!.cards.findIndex((c) => c.id === overCard.id)
      : targetList!.cards.length;

    // Actualización optimista local + persistencia en backend (que emitirá el evento a los demás)
    moveCardLocal(activeCardId, targetListId, targetPosition);
    await moveCardApi(boardId, activeCardId, { listId: targetListId, position: targetPosition });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-full px-4 py-4 flex items-center gap-4">
          <Link to="/boards" className="text-sm text-slate-500 hover:text-slate-700">
            ← Tableros
          </Link>
          <h1 className="text-lg font-semibold">{board.title}</h1>
          <div className="flex -space-x-2 ml-auto">
            {board.members.map((m) => (
              <div
                key={m.id}
                title={m.user.name}
                className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-medium flex items-center justify-center border-2 border-white"
              >
                {m.user.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start">
            {sortedLists.map((list) => (
              <ListColumn key={list.id} list={list} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} />
            ))}

            <form onSubmit={handleAddList} className="w-72 flex-shrink-0">
              <input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="+ Agregar lista"
                className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </form>
          </div>

          <DragOverlay>
            {activeCard ? <CardItem card={activeCard} onDelete={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
