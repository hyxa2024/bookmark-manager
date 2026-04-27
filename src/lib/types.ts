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
/** Edge 书签原始节点（Chromium Bookmarks JSON 格式） */
export interface EdgeBookmarkNode {
  type?: "url" | "folder";
  name?: string;
  url?: string;
  children?: EdgeBookmarkNode[];
  date_added?: number;
  date_last_used?: number;
}

export interface EdgeBookmarksFile {
  checksum?: string;
  roots?: {
    bookmark_bar?: EdgeBookmarkNode;
    other?: EdgeBookmarkNode;
    synced?: EdgeBookmarkNode;
  };
  version?: number;
}

/** 解析后的书签（供导入使用） */
export interface ParsedBookmark {
  title: string;
  url: string;
  folder: string;
  category: string;
  selected: boolean;
}
