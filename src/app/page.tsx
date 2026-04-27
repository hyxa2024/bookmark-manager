"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark } from "@/lib/types";
import BookmarkCard from "@/components/BookmarkCard";
import AddBookmark from "@/components/AddBookmark";

const CATEGORIES = ["全部", "技术", "设计", "工具", "阅读", "其他"];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user as unknown as { email: string });
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user as unknown as { email: string });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 获取书签列表
  const fetchBookmarks = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      console.error("获取书签失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // 删除书签
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("删除失败:", err);
      alert("删除失败，请重试");
    }
  };

  // 退出登录
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 过滤书签
  const filteredBookmarks = bookmarks.filter((b) => {
    const matchCategory =
      activeCategory === "全部" || b.category === activeCategory;
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">
              书签管理器
            </h1>
            <p className="text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition-all hover:border-red-300 hover:text-red-500"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* 添加书签 */}
        <div className="mb-6">
          <AddBookmark onAdded={fetchBookmarks} />
        </div>

        {/* 搜索 + 筛选 */}
        <div className="mb-6 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索书签（标题、链接、分类）..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--card-bg)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 书签列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-[var(--muted)]">加载中...</div>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-4">
              <svg className="h-12 w-12 text-[var(--muted)] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {bookmarks.length === 0
                ? "还没有书签，点击上方添加第一个吧"
                : "没有找到匹配的书签"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-[var(--muted)]">
              共 {filteredBookmarks.length} 个书签
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
