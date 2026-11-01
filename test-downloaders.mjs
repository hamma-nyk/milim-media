import assert from "node:assert";
import { POST as tiktokHandler } from "./src/app/api/tiktok/route.ts";
import { POST as igHandler } from "./src/app/api/instagram/route.ts";
import { POST as igAliasHandler } from "./src/app/api/ig/route.ts";

async function runTests() {
  console.log("1. Test TikTok Downloader (HD Quality)");
  const ttReq = new Request("http://localhost/api/tiktok", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tiktok_url: "https://www.tiktok.com/@scout2015/video/6718335390845095173" }),
  });
  const ttRes = await tiktokHandler(ttReq);
  const ttData = await ttRes.json();
  assert.strictEqual(ttRes.status, 200);
  assert.strictEqual(ttData.success, true);
  assert.strictEqual(ttData.quality, "HD", "TikTok quality must be HD");
  assert.ok(ttData.download_url?.startsWith("http"), "TikTok download_url must be valid URL");
  console.log("   -> Quality:", ttData.quality);
  console.log("   -> URL:", ttData.download_url.slice(0, 60) + "...");

  console.log("\n2. Test Instagram Downloader (HD Quality - ultra-igdl)");
  const igReq = new Request("http://localhost/api/instagram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: "https://www.instagram.com/reel/CzILOgEyIum/" }),
  });
  const igRes = await igHandler(igReq);
  const igData = await igRes.json();
  assert.strictEqual(igRes.status, 200);
  assert.strictEqual(igData.success, true);
  assert.strictEqual(igData.quality, "HD", "Instagram quality must be HD");
  assert.ok(igData.download_url?.startsWith("http"));
  console.log("   -> Quality:", igData.quality);
  console.log("   -> URL:", igData.download_url.slice(0, 60) + "...");

  console.log("\n3. Test Instagram Downloader (HD Quality - alldl best fallback)");
  const igReq2 = new Request("http://localhost/api/instagram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: "https://www.instagram.com/reel/DecKfK4y71P/" }),
  });
  const igRes2 = await igHandler(igReq2);
  const igData2 = await igRes2.json();
  assert.strictEqual(igRes2.status, 200);
  assert.strictEqual(igData2.success, true);
  assert.strictEqual(igData2.quality, "HD", "Instagram fallback quality must be HD");
  assert.ok(igData2.download_url?.startsWith("http"));
  console.log("   -> Quality:", igData2.quality);
  console.log("   -> URL:", igData2.download_url.slice(0, 60) + "...");

  console.log("\n4. Test /api/ig alias route");
  const igAliasReq = new Request("http://localhost/api/ig", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: "https://www.instagram.com/reel/CzILOgEyIum/" }),
  });
  const igAliasRes = await igAliasHandler(igAliasReq);
  const igAliasData = await igAliasRes.json();
  assert.strictEqual(igAliasRes.status, 200);
  assert.strictEqual(igAliasData.quality, "HD");
  console.log("   -> OK");

  console.log("\n ALL 4 HD TESTS PASSED!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
