import fs from 'fs';
import path from 'path';
import os from 'os';
import { EdgeBookmarksFile, EdgeBookmarkNode, ParsedBookmark } from '@/lib/types';

/**
 * 解析 Edge 书签 JSON 文件，递归展平所有文件夹，并输出可导入的书签列表
 * @param json Edge 书签文件的 JSON 对象
 * @returns 展平后的书签数组，每条包含标题、URL、文件夹路径、分类及选中状态
 */
export function parseEdgeBookmarks(json: EdgeBookmarksFile): ParsedBookmark[] {
  const results: ParsedBookmark[] = [];

  const walk = (node?: EdgeBookmarkNode, folderPath: string = ''): void => {
    if (!node) return;

    // 如果是书签 URL 节点
    if (node.type === 'url' && node.url) {
      const url = node.url.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        results.push({
          title: node.name ?? '',
          url,
          folder: folderPath || '',
          category: '',
          selected: true
        } as ParsedBookmark);
      }
      return;
    }

    // 处理文件夹节点，继续展开其子节点
    const folderName = node.name ?? '';
    const newFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child, newFolderPath);
      }
    }
  };

  const roots: (EdgeBookmarkNode | undefined)[] = [
    json.roots?.bookmark_bar,
    json.roots?.other,
    json.roots?.synced
  ];

  for (const r of roots) {
    walk(r, '');
  }

  return results;
}

/**
 * 查找 Edge 浏览器 Bookmarks 的本地文件路径（Windows 系统）
 * 会依次检查 Default、Profile 1、Profile 2 ... 等所有配置文件目录
 * 返回第一个找到的 Bookmarks 文件路径，若均不存在则返回 null
 */
export function findEdgeBookmarksPath(): string | null {
  const baseDir = path.join(
    os.homedir(),
    'AppData', 'Local', 'Microsoft', 'Edge', 'User Data'
  );

  // 按优先级排列的候选目录名
  const candidates = ['Default', 'Profile 1', 'Profile 2', 'Profile 3'];

  for (const dir of candidates) {
    const filePath = path.join(baseDir, dir, 'Bookmarks');
    try {
      if (fs.existsSync(filePath)) return filePath;
    } catch {
      // ignore
    }
  }
  return null;
}
