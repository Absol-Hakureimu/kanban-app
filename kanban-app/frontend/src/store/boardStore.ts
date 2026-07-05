import { create } from "zustand";
import type { Board, Card, List } from "../types";

interface BoardState {
  board: Board | null;
  setBoard: (board: Board) => void;
  addList: (list: List) => void;
  addCard: (card: Card) => void;
  updateCard: (card: Partial<Card> & { id: string }) => void;
  moveCardLocal: (cardId: string, targetListId: string, position: number) => void;
  removeCard: (cardId: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,

  setBoard: (board) => set({ board }),

  addList: (list) =>
    set((state) => {
      if (!state.board) return state;
      return { board: { ...state.board, lists: [...state.board.lists, { ...list, cards: [] }] } };
    }),

  addCard: (card) =>
    set((state) => {
      if (!state.board) return state;
      const lists = state.board.lists.map((list) =>
        list.id === card.listId ? { ...list, cards: [...list.cards, card] } : list
      );
      return { board: { ...state.board, lists } };
    }),

  updateCard: (partial) =>
    set((state) => {
      if (!state.board) return state;
      const lists = state.board.lists.map((list) => ({
        ...list,
        cards: list.cards.map((c) => (c.id === partial.id ? { ...c, ...partial } : c)),
      }));
      return { board: { ...state.board, lists } };
    }),

  // Actualización optimista al arrastrar una tarjeta: la mueve de lista sin esperar al backend
  moveCardLocal: (cardId, targetListId, position) =>
    set((state) => {
      if (!state.board) return state;

      let movedCard: Card | undefined;
      const listsWithoutCard = state.board.lists.map((list) => {
        const found = list.cards.find((c) => c.id === cardId);
        if (found) movedCard = found;
        return { ...list, cards: list.cards.filter((c) => c.id !== cardId) };
      });

      if (!movedCard) return state;

      const updatedCard = { ...movedCard, listId: targetListId, position };

      const lists = listsWithoutCard.map((list) => {
        if (list.id !== targetListId) return list;
        const newCards = [...list.cards];
        newCards.splice(position, 0, updatedCard);
        return { ...list, cards: newCards };
      });

      return { board: { ...state.board, lists } };
    }),

  removeCard: (cardId) =>
    set((state) => {
      if (!state.board) return state;
      const lists = state.board.lists.map((list) => ({
        ...list,
        cards: list.cards.filter((c) => c.id !== cardId),
      }));
      return { board: { ...state.board, lists } };
    }),
}));
