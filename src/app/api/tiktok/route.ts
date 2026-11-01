import { NextResponse } from "next/server";

// ponytail: tikwm hd=1 primary + alldl best quality fallback.
async function resolveUrl(input: string): Promise<string> {
  try {
    const res = await fetch(input, { method: "HEAD", redirect: "follow" });
    return res.url || input;
  } catch {
    return input;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body.tiktok_url || body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL TikTok diperlukan" }, { status: 400 });
    }

    const targetUrl = await resolveUrl(rawUrl.trim());

    // 1. TikWM API (HD enabled)
    try {
      const res = await fetch(`https://www.tikwm.com/api/?hd=1&url=${encodeURIComponent(targetUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        const json = await res.json();
        const hdUrl = json.data?.hdplay || json.data?.play;
        if (json.code === 0 && hdUrl) {
          return NextResponse.json({
            success: true,
            title: json.data.title || "TikTok Video",
            download_url: hdUrl,
            quality: json.data?.hdplay ? "HD" : "SD",
            author: json.data.author?.nickname || json.data.author?.unique_id || "TikTok User",
          });
        }
      }
    } catch {}

    // 2. Fallback: rahad-all-downloader-v2 (Best HD quality)
    const { alldl } = await import("rahad-all-downloader-v2");
    const result = await alldl(targetUrl, { quality: "best" });
    const data = result?.data as any;
    const downloadUrl =
      data?.videoUrl ||
      data?.download?.no_watermark ||
      data?.download?.url;

    if (!downloadUrl) {
      return NextResponse.json({ error: "Gagal mengambil video TikTok" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      title: result?.data?.title || "TikTok Video",
      download_url: downloadUrl,
      quality: "HD",
      author: "TikTok User",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memproses link TikTok", details: err.message },
      { status: 500 }
    );
  }
}
