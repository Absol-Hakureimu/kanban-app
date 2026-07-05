export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CardAssignee {
  id: string;
  cardId: string;
  userId: string;
  user: User;
}

export interface Card {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  dueDate?: string | null;
  listId: string;
  creatorId: string;
  assignees: CardAssignee[];
}

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
}

export interface BoardMember {
  id: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: User;
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  lists: List[];
  members: BoardMember[];
}
