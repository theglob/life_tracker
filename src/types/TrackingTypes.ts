export interface TrackingItem {
  id: string;
  name: string;
  rating?: number;
  subItems?: TrackingItem[];
}

export interface Category {
  id: string;
  name: string;
  items: TrackingItem[];
}

export interface TrackingEntry {
  id: string;
  timestamp: Date;
  categoryId: string;
  itemId: string;
  rating?: number;
  notes?: string;
} 