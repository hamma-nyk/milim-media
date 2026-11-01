import { NextResponse } from "next/server";

// ponytail: ultra-igdl primary + alldl fallback; add auth session cookies if private media required.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body.instagram_url || body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL Instagram diperlukan" }, { status: 400 });
    }

    const targetUrl = rawUrl.trim();

    // 1. ultra-igdl
    try {
      const igModule = await import("ultra-igdl");
      const IgClient = ((igModule as any).default || (igModule as any).ultraigdl) as new () => {
        download: (u: string) => Promise<{ media?: Array<{ url: string; type: string }>; caption?: string }>;
      };
      const client = new IgClient();
      const res = await client.download(targetUrl);
      const media = res?.media?.find((m) => m.type === "video") || res?.media?.[0];
      if (media?.url) {
        return NextResponse.json({
          success: true,
          download_url: media.url,
          title: res?.caption ? res.caption.slice(0, 50) : "Instagram Media",
        });
      }
    } catch {}

    // 2. Fallback: rahad-all-downloader-v2
    const { alldl } = await import("rahad-all-downloader-v2");
    const result = await alldl(targetUrl);
    const data = result?.data as any;
    const downloadUrl =
      data?.videoUrl ||
      data?.download?.url ||
      data?.download?.no_watermark;

    if (!downloadUrl) {
      return NextResponse.json({ error: "Gagal mengambil video Instagram" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      title: result?.data?.title || "Instagram Video",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memproses link Instagram", details: err.message },
      { status: 500 }
    );
  }
}
