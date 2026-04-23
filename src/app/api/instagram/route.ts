import { NextResponse } from "next/server";
// import { Redis } from '@upstash/redis';

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

export async function POST(request: Request) {
  try {
    const { instagram_url } = await request.json();

    if (!instagram_url) {
      return NextResponse.json(
        { error: "URL Instagram diperlukan" },
        { status: 400 },
      );
    }

    // const rawKeys = await redis.get<string>('browserless_io');
    // if (!rawKeys) return NextResponse.json({ error: "No keys found" }, { status: 500 });

    // const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    // const token = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    // 1. Script Browserless untuk Snapsave
    const jsCode = `
    export default async ({ page }) => {
        try {
            
            await page.goto('https://fastdl.app/', { waitUntil: 'networkidle2' });
            
            // 1. Input link Instagram (Placeholder: Paste video URL Facebook/Instagram)
            const inputSelector = 'input#search-form-input'; // Snapsave biasanya menggunakan id="url"
            await page.waitForSelector(inputSelector, { timeout: 10000 });
            await page.type(inputSelector, '${instagram_url}');
            
            // 2. Klik tombol Download
            await page.click('button#searchFormButton'); // Snapsave menggunakan button id="send"

            // 3. Tunggu tombol download hasil konversi muncul
            // Berdasarkan logika Drission kamu: tag 'a' dengan class 'button is-success'
            const finalBtnSelector = 'a.button.button--filled.button__download';
            
            // Kadang Snapsave butuh waktu lebih lama untuk memproses video HD
            await page.waitForSelector(finalBtnSelector, { timeout: 25000 });

            // 4. Ambil data
            const result = await page.evaluate((sel) => {
                const el = document.querySelector(sel);    
                return {
                    download_url: el ? el.getAttribute('href') : null,
                };
            }, finalBtnSelector);

            return { data: result, type: "application/json" };

        } catch (err) {
            return { data: { error: err.message }, type: "application/json" };
        }
    };
    `;

    // Ambil token dari environment
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

        if (response.ok) {
          const result = await response.json();
          if (result.data && !result.data.error) {
            return NextResponse.json({
              success: true,
              download_url: result.data.download_url,
            });
          }
          lastError = result.data?.error || "Gagal konversi";
        } else {
          lastError = `Browserless Error: ${response.statusText}`;
        }
      } catch (error: any) {
        lastError = error.message;
      }
    }

    return NextResponse.json(
      { error: "Gagal mengambil data Instagram.", details: lastError },
      { status: 503 },
    );
  } catch (err: any) {
    console.error("Internal Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
