"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AddBookmarkProps {
  onAdded: () => void;
}

const CATEGORIES = ["技术", "设计", "工具", "阅读", "其他"];

export default function AddBookmark({ onAdded }: AddBookmarkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("技术");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setCategory("技术");
    setDescription("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !url.trim()) {
      setError("标题和链接不能为空");
      return;
    }

    const finalUrl = normalizeUrl(url);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { error: insertError } = await supabase
        .from("bookmarks")
        .insert({
          title: title.trim(),
          url: finalUrl,
          category,
          description: description.trim(),
          user_id: user.id,
        });

      if (insertError) throw insertError;

      resetForm();
      setIsOpen(false);
      onAdded();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "添加失败，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm">
      {/* 折叠头部 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-[var(--background)] rounded-xl"
      >
        <span className="text-sm font-medium text-[var(--foreground)]">
          添加新书签
        </span>
        <svg
          className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 展开的表单 */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-5 py-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Next.js 官方文档"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              链接 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="例如：nextjs.org（自动补全 https://）"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    category === cat
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述这个书签..."
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "添加中..." : "添加书签"}
          </button>
        </form>
      )}
    </div>
  );
}
