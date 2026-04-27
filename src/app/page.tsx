"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark, Category } from "@/lib/types";
import { getCategoryColorClass, getColorDotClass } from "@/lib/colors";
import BookmarkCard from "@/components/BookmarkCard";
import ImportBookmarks from "@/components/ImportBookmarks";
import AddBookmark from "@/components/AddBookmark";

const DEFAULT_CATEGORIES = [
  { name: "技术", color: "blue" },
  { name: "设计", color: "purple" },
  { name: "工具", color: "amber" },
  { name: "阅读", color: "emerald" },
  { name: "其他", color: "gray" },
];

const COLOR_OPTIONS = [
  { label: "蓝色", value: "blue" },
  { label: "紫色", value: "purple" },
  { label: "琥珀", value: "amber" },
  { label: "绿色", value: "emerald" },
  { label: "红色", value: "red" },
  { label: "粉色", value: "pink" },
  { label: "青色", value: "cyan" },
  { label: "灰色", value: "gray" },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  // 分类管理状态
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("blue");
  const [catLoading, setCatLoading] = useState(false);

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
      const u = session.user;
      setUser({ id: u.id, email: u.email ?? "" });

      // 首次登录：检查是否有分类，没有则插入默认分类
      const { data: existingCats } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", u.id)
        .limit(1);

      if (!existingCats || existingCats.length === 0) {
        await supabase.from("categories").insert(
          DEFAULT_CATEGORIES.map((c) => ({
            name: c.name,
            color: c.color,
            user_id: u.id,
          }))
        );
      }
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        const u = session.user;
        setUser({ id: u.id, email: u.email ?? "" });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("获取分类失败:", err);
    }
  }, []);

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
    if (!user) return;
    fetchCategories();
    fetchBookmarks();
  }, [user, fetchCategories, fetchBookmarks]);

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

  // 添加自定义分类
  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    setCatLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { error } = await supabase.from("categories").insert({
        name,
        color: newCatColor,
        user_id: currentUser.id,
      });

      if (error) {
        if (error.code === "23505") {
          alert("分类名称已存在");
        } else {
          throw error;
        }
        return;
      }

      setNewCatName("");
      setNewCatColor("blue");
      fetchCategories();
    } catch (err) {
      console.error("添加分类失败:", err);
      alert("添加分类失败，请重试");
    } finally {
      setCatLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string, name: string) => {
    // 检查是否有书签在使用这个分类
    const usingCount = bookmarks.filter((b) => b.category === name).length;
    const msg = usingCount > 0
      ? `有 ${usingCount} 个书签正在使用「${name}」分类，删除后这些书签的分类会变成无效值。确定删除吗？`
      : `确定要删除分类「${name}」吗？`;

    if (!window.confirm(msg)) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      fetchCategories();
      if (activeCategory === name) setActiveCategory("全部");
    } catch (err) {
      console.error("删除分类失败:", err);
      alert("删除分类失败，请重试");
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
          <AddBookmark categories={categories} onAdded={fetchBookmarks} />
        </div>

        {/* Edge 书签导入面板 */}
        <div className="mb-6">
          <ImportBookmarks categories={categories} onImported={fetchBookmarks} />
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory("全部")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeCategory === "全部"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--card-bg)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeCategory === cat.name
                    ? "bg-[var(--primary)] text-white"
                    : `${getCategoryColorClass(cat.color)} border border-transparent hover:opacity-80`
                }`}
              >
                {cat.name}
              </button>
            ))}
            {/* 管理分类按钮 */}
            <button
              onClick={() => setShowCatManager(!showCatManager)}
              className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              管理分类
            </button>
          </div>
        </div>

        {/* 分类管理面板 */}
        {showCatManager && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">管理分类</h3>

            {/* 已有分类列表 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-1.5 rounded-full bg-[var(--background)] px-3 py-1"
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getColorDotClass(cat.color)}`}
                  />
                  <span className="text-xs text-[var(--foreground)]">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="ml-0.5 text-xs text-[var(--muted)] opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            {/* 添加新分类 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">分类名称</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="输入新分类名称"
                  maxLength={10}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">颜色</label>
                <div className="flex gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewCatColor(c.value)}
                      title={c.label}
                      className={`h-7 w-7 rounded-full transition-all ${
                        newCatColor === c.value ? "ring-2 ring-offset-2 ring-[var(--primary)]" : ""
                      } ${getColorDotClass(c.value)}`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddCategory}
                disabled={catLoading || !newCatName.trim()}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {catLoading ? "..." : "添加"}
              </button>
            </div>
          </div>
        )}

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
                  categories={categories}
                  onDelete={handleDelete}
                  onUpdated={fetchBookmarks}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
