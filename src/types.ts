export interface Entry {
  id: string;
  timestamp: string;
  userId: string;
  categoryId: string;
  itemId: string;
  rating?: number;
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  items: Item[];
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
} 