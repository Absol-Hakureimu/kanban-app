import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useBoardStore } from "../store/boardStore";
import type { Card, List } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";

// Conecta al servidor de sockets y suscribe al tablero indicado, sincronizando
// los cambios de otros usuarios en tiempo real dentro del store local.
export function useSocket(boardId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { addList, addCard, updateCard, moveCardLocal, removeCard } = useBoardStore();

  useEffect(() => {
    if (!boardId || !accessToken) return;

    const socket = io(SOCKET_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.emit("board:join", boardId);

    socket.on("list:created", ({ list }: { list: List }) => addList(list));
    socket.on("card:created", ({ card }: { card: Card }) => addCard(card));
    socket.on("card:updated", ({ card }: { card: Card }) => updateCard(card));
    socket.on("card:moved", ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) =>
      moveCardLocal(cardId, listId, position)
    );
    socket.on("card:deleted", ({ cardId }: { cardId: string }) => removeCard(cardId));

    return () => {
      socket.emit("board:leave", boardId);
      socket.disconnect();
    };
  }, [boardId, accessToken, addList, addCard, updateCard, moveCardLocal, removeCard]);

  return socketRef.current;
}
