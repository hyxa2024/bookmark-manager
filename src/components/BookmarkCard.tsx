"use client";

import { Bookmark } from "@/lib/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const handleDelete = () => {
    if (window.confirm(`确定要删除「${bookmark.title}」吗？`)) {
      onDelete(bookmark.id);
    }
  };

  const categoryColors: Record<string, string> = {
    技术: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    设计: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    工具: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    阅读: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    其他: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };

  const colorClass = categoryColors[bookmark.category] || categoryColors["其他"];

  return (
    <div className="group relative rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition-all hover:shadow-md">
      {/* 分类标签 */}
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {bookmark.category}
      </span>

      {/* 标题 */}
      <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--primary)] transition-colors line-clamp-1"
        >
          {bookmark.title}
        </a>
      </h3>

      {/* URL */}
      <p className="mt-1 text-xs text-[var(--muted)] truncate">{bookmark.url}</p>

      {/* 描述 */}
      {bookmark.description && (
        <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* 底部 */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {new Date(bookmark.created_at).toLocaleDateString("zh-CN")}
        </span>
        <button
          onClick={handleDelete}
          className="rounded-lg px-2.5 py-1 text-xs text-red-500 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-900/20"
        >
          删除
        </button>
      </div>
    </div>
  );
}
