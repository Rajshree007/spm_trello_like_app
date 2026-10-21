export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  cardId: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  checklistId: string;
}

export interface Checklist {
  id: string;
  title: string;
  cardId: string;
  items: ChecklistItem[];
}

export interface Activity {
  id: string;
  text: string;
  cardId: string;
  userId: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Card {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  dueDate?: string | null;
  listId: string;
  labels: Label[];
  checklists: Checklist[];
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: 'OWNER' | 'MEMBER';
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Board {
  id: string;
  title: string;
  background: string;
  ownerId: string;
  members: BoardMember[];
  lists: List[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
