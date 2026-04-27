export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}
