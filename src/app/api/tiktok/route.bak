import { NextResponse } from "next/server";
// import { Redis } from '@upstash/redis';

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

export async function POST(request: Request) {
  try {
    const { tiktok_url } = await request.json();

    if (!tiktok_url) {
      return NextResponse.json({ error: "URL TikTok diperlukan" }, { status: 400 });
    }

    // 1. Ambil & Shuffle Keys dari Redis
    // const rawKeys = await redis.get<string>('browserless_io');
    // if (!rawKeys) {
    //   return NextResponse.json({ error: "No keys found in Redis" }, { status: 500 });
    // }

    // const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    // const shuffledKeys = apiKeys.sort(() => Math.random() - 0.5);

    // 2. Script Browserless (Logika DrissionPage yang dipindah ke JS/Puppeteer)
    const jsCode = `
    export default async ({ page }) => {
    try {
        await page.goto('https://snaptik.app/en2', { waitUntil: 'networkidle2' });
        
        // 1. Input link TikTok
        const inputSelector = 'input[placeholder="Paste TikTok link here"]';
        await page.waitForSelector(inputSelector);
        await page.type(inputSelector, '${tiktok_url}');
        
        // 2. Klik tombol Download
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const downloadBtn = buttons.find(b => b.textContent.includes('Download'));
            if (downloadBtn) downloadBtn.click();
        });

        // 3. Tunggu sampai kontainer hasil (.info) muncul sebelum ambil data
        // Ini kunci agar key author tidak hilang
        await page.waitForSelector('.info', { timeout: 20000 });
        const finalBtnSelector = 'a.button.download-file';
        await page.waitForSelector(finalBtnSelector, { timeout: 20000 });

        // 4. Ambil data
        const result = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const titleElement = document.querySelector('.video-title');
            
            // Ambil kontainer info
            const infoBox = document.querySelector('.info');
            
            // Cari author di dalam span atau h3
            let authorText = 'Unknown Author';
            if (infoBox) {
                const authorEl = infoBox.querySelector('span') || infoBox.querySelector('h3');
                if (authorEl && authorEl.innerText.trim() !== "") {
                    authorText = authorEl.innerText.trim();
                }
            }
            
            let rawTitle = titleElement ? titleElement.innerText.trim() : 'No Title';
            const limit = 20;
            const finalTitle = rawTitle.length > limit 
                ? rawTitle.substring(0, limit) + "..." 
                : rawTitle;
                
            // Pastikan semua key didefinisikan dengan jelas di sini
            return {
                download_url: el ? el.getAttribute('href') : null,
                title: finalTitle,
                author: authorText // Key ini sekarang dijamin ada nilainya
            };
        }, finalBtnSelector);

        return { data: result, type: "application/json" };

    } catch (err) {
        return { data: { error: err.message }, type: "application/json" };
    }
};
    `;

    // TESTING
    const shuffledKeys = [process.env.BROWSERLESS_TOKEN!];
    let lastError = null;

    // 3. Retry Logic
    for (const key of shuffledKeys) {
      try {
        const url = `https://production-sfo.browserless.io/function?token=${key}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/javascript" },
          body: jsCode,
        });

        if (response.status === 401 || response.status === 429) {
          lastError = `Key ${key.substring(0, 5)} limit/unauthorized.`;
          continue;
        }

        if (response.ok) {
          const result = await response.json();
          if (result.data && !result.data.error) {
            return NextResponse.json({
              success: true,
              title: result.data.title,
              download_url: result.data.download_url,
              author: result.data.author
            });
          }
          lastError = result.data?.error || "Gagal konversi";
        }
      } catch (error: any) {
        lastError = error.message;
        continue;
      }
    }

    return NextResponse.json(
      { error: "Semua API Keys gagal.", details: lastError },
      { status: 503 }
    );

  } catch (err: any) {
    console.error("Internal Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}