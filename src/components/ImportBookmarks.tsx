"use client";

import React, { useMemo, useRef, useState } from "react";
import { Category, ParsedBookmark } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface ImportBookmarksProps {
  categories: Category[];
  onImported: () => void;
}

type Status = "closed" | "loading" | "upload" | "preview" | "saving" | "done";

export default function ImportBookmarks({ categories, onImported }: ImportBookmarksProps) {
  const [status, setStatus] = useState<Status>("closed");
  const [bookmarks, setBookmarks] = useState<ParsedBookmark[]>([]);
  const [loadingError, setLoadingError] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Open/trigger read of Edge bookmarks
  const openPanel = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/import-bookmarks");
      const data = await res.json();
      if (data.success && Array.isArray(data.bookmarks)) {
        const list = data.bookmarks.map((b: Record<string, unknown>) => ({
          title: String(b.title ?? ""),
          url: String(b.url ?? ""),
          folder: String(b.folder ?? ""),
          category: String(b.category ?? categories[0]?.name ?? ""),
          selected: true,
        })) as ParsedBookmark[];
        setBookmarks(list);
        setStatus("preview");
        setLoadingError("");
      } else {
        setStatus("upload");
        setLoadingError(data.error ?? "读取失败，请上传本地 Edge 书签文件");
      }
    } catch (e) {
      setStatus("upload");
      setLoadingError("读取失败，请上传本地 Edge 书签文件");
    }
  };

  // Upload a local Edge bookmarks file
  const handleFileUpload = async (file: File) => {
    setStatus("loading");
    setUploadError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/import-bookmarks", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.bookmarks)) {
        const list = data.bookmarks.map((b: Record<string, unknown>) => ({
          title: String(b.title ?? ""),
          url: String(b.url ?? ""),
          folder: String(b.folder ?? ""),
          category: String(b.category ?? categories[0]?.name ?? ""),
          selected: true,
        })) as ParsedBookmark[];
        setBookmarks(list);
        setStatus("preview");
        setUploadError("");
      } else {
        setStatus("upload");
        setUploadError(data.error ?? "导入失败，请重试");
      }
    } catch {
      setStatus("upload");
      setUploadError("导入失败，请重试");
    }
  };

  const allSelected = useMemo(() => bookmarks.length > 0 && bookmarks.every((b) => b.selected), [bookmarks]);

  const toggleSelectAll = () => {
    const next = !allSelected;
    setBookmarks((prev) => prev.map((b) => ({ ...b, selected: next })));
  };

  const updateSelected = (index: number, value: boolean) => {
    setBookmarks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: value };
      return next;
    });
  };

  const updateCategory = (index: number, value: string) => {
    setBookmarks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], category: value };
      return next;
    });
  };

  const handleSave = async () => {
    const selected = bookmarks.filter((b) => b.selected);
    if (selected.length === 0) return;
    // Get user session to attach user_id and token
    setStatus("saving");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? "";
      const accessToken = session?.access_token ?? "";

      const payload = selected.map((b) => ({
        title: b.title,
        url: b.url,
        category: b.category,
        description: "",
        user_id: userId,
      }));

      const res = await fetch("/api/save-bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarks: payload, accessToken: accessToken }),
      });
      const data = await res.json();
      const imported = data?.imported ?? 0;
      const failed = data?.failed ?? 0;
      // Reset/close after success
      setStatus("done");
      // Notify parent to refresh
      onImported();
      // Auto close after a moment
      setTimeout(() => {
        setStatus("closed");
      }, 2000);
    } catch {
      setStatus("preview");
    }
  };

  const onZoneClick = () => fileInputRef.current?.click();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm">
      {status === "closed" && (
        <button
          onClick={openPanel}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-[var(--background)] rounded-xl"
        >
          <span className="text-sm font-medium text-[var(--foreground)]">导入 Edge 书签</span>
          <svg className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center justify-center px-5 py-6">
          <span className="text-sm text-[var(--foreground)]">正在读取 Edge 书签...</span>
        </div>
      )}

      {status === "upload" && (
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div
            onClick={onZoneClick}
            className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--foreground)]"
          >
            <div className="text-center">
              <div className="mb-2">请手动上传 Edge 书签文件</div>
              <div className="text-xs text-[var(--muted)]">%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Bookmarks</div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
          {loadingError && (
            <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{loadingError}</div>
          )}
          {uploadError && (
            <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{uploadError}</div>
          )}
        </div>
      )}

      {status === "preview" && (
        <div className="px-0 py-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--foreground)]">共 {bookmarks.length} 个书签，已选 {bookmarks.filter(b => b.selected).length} 个</span>
            <button onClick={toggleSelectAll} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              {allSelected ? "取消全选" : "全选"}
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto px-5 py-2">
            {bookmarks.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-[var(--border)] py-2 last:border-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={b.selected}
                    onChange={(e) => updateSelected(idx, e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-[var(--foreground)]">{b.title}</div>
                    <div className="text-xs text-[var(--muted)] truncate">{b.url}</div>
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  <select
                    value={b.category}
                    onChange={(e) => updateCategory(idx, e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-sm text-[var(--foreground)] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <div className="text-xs text-[var(--muted)]">来源文件夹将显示在书签的 folder 字段中（若需要可编辑）</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setStatus("closed")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]">取消</button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] disabled:opacity-50"
                disabled={bookmarks.filter((b) => b.selected).length === 0}
              >
                导入 {bookmarks.filter((b) => b.selected).length} 个书签
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "saving" && (
        <div className="flex items-center justify-center px-5 py-6">
          <span className="text-sm text-[var(--foreground)]">正在导入...</span>
        </div>
      )}

      {status === "done" && (
        <div className="px-5 py-4">
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            成功导入书签
          </div>
        </div>
      )}
    </div>
  );
}
