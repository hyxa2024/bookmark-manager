"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bookmark, Category } from "@/lib/types";
import { getCategoryColorClass } from "@/lib/colors";

interface BookmarkCardProps {
  bookmark: Bookmark;
  categories: Category[];
  onDelete: (id: string) => void;
  onUpdated: () => void;
}

export default function BookmarkCard({ bookmark, categories, onDelete, onUpdated }: BookmarkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [category, setCategory] = useState(bookmark.category);
  const [description, setDescription] = useState(bookmark.description);
  const [saving, setSaving] = useState(false);

  // 根据分类名查找颜色
  const getCategoryStyle = (catName: string) => {
    const found = categories.find((c) => c.name === catName);
    return getCategoryColorClass(found?.color ?? "gray");
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除「${bookmark.title}」吗？`)) {
      onDelete(bookmark.id);
    }
  };

  const handleCancel = () => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setCategory(bookmark.category);
    setDescription(bookmark.description);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;

    setSaving(true);
    try {
      const finalUrl = !/^https?:\/\//i.test(url.trim())
        ? `https://${url.trim()}`
        : url.trim();

      const { error } = await supabase
        .from("bookmarks")
        .update({
          title: title.trim(),
          url: finalUrl,
          category,
          description: description.trim(),
        })
        .eq("id", bookmark.id);

      if (error) throw error;
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error("更新失败:", err);
      alert("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 编辑模式
  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--card-bg)] p-5 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">链接</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">分类</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                    category === cat.name
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background)] text-[var(--muted)]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-[var(--primary)] py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-[var(--border)] py-1.5 text-xs font-medium text-[var(--muted)] transition-all hover:text-[var(--foreground)]"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 展示模式
  const colorClass = getCategoryStyle(bookmark.category);

  return (
    <div className="group relative rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition-all hover:shadow-md">
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {bookmark.category}
      </span>

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

      <p className="mt-1 text-xs text-[var(--muted)] truncate">{bookmark.url}</p>

      {bookmark.description && (
        <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
          {bookmark.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {new Date(bookmark.created_at).toLocaleDateString("zh-CN")}
        </span>
        <div className="flex gap-1 opacity-0 transition-all group-hover:opacity-100">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-2.5 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
