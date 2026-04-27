import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type BookmarkInput = {
  title: string;
  url: string;
  category: string;
  description?: string;
  user_id?: string;
};

type ImportPayload = {
  bookmarks: BookmarkInput[];
  accessToken: string;
};

/**
 * Save bookmarks in batches to Supabase using a temporary client created from an access token.
 * Route: POST
 * Body: { bookmarks: Array<{title, url, category, description, user_id}>, accessToken: string }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ImportPayload;
    const { bookmarks, accessToken } = body;

    if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json({ success: false, error: "书签列表为空" });
    }
    if (bookmarks.length > 500) {
      return NextResponse.json({ success: false, error: "最多导入 500 条书签" });
    }
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "401: 未提供访问令牌" }, { status: 401 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: false, error: "Server 配置错误：缺少 Supabase 配置" }, { status: 500 });
    }

    // Create a temporary Supabase client with the provided access token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // Verify user associated with access token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "401: 未认证的用户" }, { status: 401 });
    }

    // Batch insert bookmarks in chunks of 50
    const CHUNK = 50;
    let imported = 0;
    let failed = 0;
    for (let i = 0; i < bookmarks.length; i += CHUNK) {
      const batch = bookmarks.slice(i, i + CHUNK);
      const { error } = await supabase.from("bookmarks").insert(batch);
      if (error) {
        // Record as failed for this batch but continue with remaining batches
        failed += batch.length;
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({ success: true, imported, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message });
  }
}
