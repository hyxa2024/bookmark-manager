"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.push("/");
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;
        setMessage("注册成功！请查收邮箱验证链接，然后登录。");
        setMode("login");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "操作失败，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-lg">
        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            书签管理器
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {mode === "login" ? "登录你的账号" : "创建新账号"}
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex rounded-lg bg-[var(--background)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6个字符"
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]/20"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "处理中..."
              : mode === "login"
                ? "登录"
                : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
