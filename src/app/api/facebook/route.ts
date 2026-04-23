import { NextResponse } from "next/server";
// import { Redis } from '@upstash/redis';

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

export async function POST(request: Request) {
  try {
    const { facebook_url } = await request.json();

    if (!facebook_url) {
      return NextResponse.json(
        { error: "URL Facebook diperlukan" },
        { status: 400 },
      );
    }

    // 1. Ambil & Shuffle Keys dari Redis
    // const rawKeys = await redis.get<string>('browserless_io');
    // if (!rawKeys) {
    //   return NextResponse.json({ error: "No keys found in Redis" }, { status: 500 });
    // }

    // const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    // const shuffledKeys = apiKeys.sort(() => Math.random() - 0.5);

    const jsCode = `
    export default async ({ page }) => {
        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
            // 1. Buka fget.io
            await page.goto('https://fget.io/', { waitUntil: 'networkidle2' });
            
            // 2. Input link ke elemen dengan ID main-link
            const inputSelector = '#main-link';
            await page.waitForSelector(inputSelector, { timeout: 10000 });
            await page.type(inputSelector, '${facebook_url}');
            
            // 3. Klik tombol Download
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                                 .find(b => b.textContent.includes('Download'));
                if (btn) btn.click();
            });

            // 4. Tunggu hasil konversi muncul
            // Berdasarkan logika Drission kamu: class 'download-result sd'
            const sdBtnSelector = 'a.download-result.sd';
            const hdBtnSelector = 'a.download-result.hd';

            // Kita tunggu sampai tombol hasil (SD) muncul di DOM
            await page.waitForSelector(sdBtnSelector, { timeout: 25000 });

            // 5. Ambil data link
            const result = await page.evaluate((sd, hd) => {
                const sdBtn = document.querySelector(sd);
                const hdBtn = document.querySelector(hd);
                
                // Biasanya judul ada di elemen dengan class title atau h3 di area hasil
                const titleElement = document.querySelector('.result-title') || document.querySelector('h3');
                
                return {
                    download_url_sd: sdBtn ? sdBtn.getAttribute('href') : null,
                    download_url_hd: hdBtn ? hdBtn.getAttribute('href') : null,
                    title: titleElement ? titleElement.innerText.trim() : 'Facebook Video'
                };
            }, sdBtnSelector, hdBtnSelector);

            return { data: result, type: "application/json" };

        } catch (err) {
            return { data: { error: err.message }, type: "application/json" };
        }
    };
    `;

    const shuffledKeys = [process.env.BROWSERLESS_TOKEN!];
    let lastError = null;
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
            const finalUrl = result.data.download_url_hd || result.data.download_url_sd;
            return NextResponse.json({
              success: true,
              title: result.data.title,
              download_url: finalUrl,
              quality: result.data.download_url_hd ? 'HD' : 'SD'
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
