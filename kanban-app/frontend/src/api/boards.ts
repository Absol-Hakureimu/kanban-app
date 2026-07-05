import { apiClient } from "./client";
import type { Board } from "../types";

export async function fetchBoards() {
  const { data } = await apiClient.get<{ boards: Board[] }>("/boards");
  return data.boards;
}

export async function fetchBoard(boardId: string) {
  const { data } = await apiClient.get<{ board: Board }>(`/boards/${boardId}`);
  return data.board;
}

export async function createBoard(payload: { title: string; description?: string }) {
  const { data } = await apiClient.post<{ board: Board }>("/boards", payload);
  return data.board;
}

export async function createList(boardId: string, title: string) {
  const { data } = await apiClient.post(`/boards/${boardId}/lists`, { title });
  return data.list;
}

export async function createCard(
  boardId: string,
  listId: string,
  payload: { title: string; description?: string }
) {
  const { data } = await apiClient.post(`/boards/${boardId}/lists/${listId}/cards`, payload);
  return data.card;
}

export async function moveCard(
  boardId: string,
  cardId: string,
  payload: { listId: string; position: number }
) {
  const { data } = await apiClient.patch(`/boards/${boardId}/cards/${cardId}/move`, payload);
  return data.card;
}

export async function deleteCard(boardId: string, cardId: string) {
  await apiClient.delete(`/boards/${boardId}/cards/${cardId}`);
}
