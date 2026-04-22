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
      return NextResponse.json({ error: "URL Instagram diperlukan" }, { status: 400 });
    }

    // const rawKeys = await redis.get<string>('browserless_io');
    // if (!rawKeys) return NextResponse.json({ error: "No keys found" }, { status: 500 });

    // const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    // const token = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "query": `
        mutation DownloadFromSnapInsta {
        viewport(width: 1366, height: 768) {
                width
                height
                time
            }
        goto(url: "https://snapinsta.to/en2", waitUntil: networkIdle) {
            status
        }

        typeURL: type(
            selector: "input[placeholder='Paste URL Instagram']"
            text: "https://www.instagram.com/reel/DXcVd7NkpKZ/?igsh=OGVuMmhwYzBwOHFh"
        ) {
            time
        }

        clickDownload: click(
            selector: "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Download') || b.type === 'submit' || b.id === 'btn-submit')"
            visible: true
        ) {
            time
        }

        waitForDownloadBtn: waitForSelector(
            selector: "a.abutton.is-success"
            timeout: 20000
            visible: true
        ) {
            time
        }

        downloadLink: querySelectorAll(selector: "a.abutton.is-success") {
            outerHTML
            innerText
        }
        }
            `,
            "operationName":"DownloadFromSnapInsta"
        })
    };
    // TESTING
    const token = process.env.BROWSERLESS_TOKEN!;
    const endpoint = "https://production-sfo.browserless.io/stealth/bql";
    const optionsString = "&blockConsentModals=true";
    const url = `${endpoint}?token=${token}${optionsString}`;

    const response = await fetch(url, options);

    const result = await response.json();

    const data = result.data;

    if (data.downloadLink && data.downloadLink.length > 0) {
        const outerHTML = data.downloadLink[0].outerHTML;

        // Gunakan Regex untuk mengambil isi di dalam href="..."
        const hrefMatch = outerHTML.match(/href="([^"]+)"/);
        
        if (hrefMatch && hrefMatch[1]) {
            const downloadUrl = hrefMatch[1].replace(/&amp;/g, '&'); // Bersihkan karakter & html
            
            // console.log("Link Download:", downloadUrl);
            
            return NextResponse.json({
            success: true,
            download_url: downloadUrl
            });
        }
    }

    return NextResponse.json({ 
      error: "Gagal mendapatkan link", 
      details: result.errors || "Tombol download tidak muncul" 
    }, { status: 503 });

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Error", details: err.message }, { status: 500 });
  }
}