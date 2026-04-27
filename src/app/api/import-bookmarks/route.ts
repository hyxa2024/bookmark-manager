import { NextResponse } from "next/server";
import { findEdgeBookmarksPath, parseEdgeBookmarks } from "@/lib/bookmark-parser";
import { classifyBookmarks } from "@/lib/classifier";
import { promises as fs } from "fs";

export const runtime = "nodejs";

/**
 * Import bookmarks from Edge bookmarks file or uploaded JSON bookmarks.
 * GET: Read local Edge bookmarks, parse and classify.
 * POST: Accept an uploaded bookmarks file (JSON), parse and classify.
 */

// GET: Read Edge bookmarks from local file system and return parsed, classified bookmarks
export async function GET(): Promise<NextResponse> {
  try {
    const edgePath = findEdgeBookmarksPath();
    if (edgePath == null) {
      return NextResponse.json({ success: false, error: "未找到 Edge 书签文件" });
    }

    const content = await fs.readFile(edgePath, { encoding: "utf8" });
    const raw = JSON.parse(content);

    const parsed = parseEdgeBookmarks(raw);
    const classified = classifyBookmarks(parsed);

    return NextResponse.json({ success: true, bookmarks: classified, source: "local" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message });
  }
}

// POST: Accept a file upload containing bookmarks (JSON), parse and classify
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "请上传书签文件" }, { status: 400 });
    }

    const text = await file.text();
    const raw = JSON.parse(text);
    const parsed = parseEdgeBookmarks(raw);
    const classified = classifyBookmarks(parsed);

    // Enforce maximum import size
    if (classified.length > 500) {
      return NextResponse.json({ success: false, error: "最多导入 500 条书签" });
    }

    return NextResponse.json({ success: true, bookmarks: classified, source: "upload" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message });
  }
}
