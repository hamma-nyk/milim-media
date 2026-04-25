"use client";

import { useState } from "react";
import { 
  Download, 
  Link as LinkIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Music2,
  ExternalLink // Ikon baru untuk tombol hasil
} from "lucide-react";

const IconInstagram = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const IconFacebook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<string | null>(null); // State simpan link hasil
  const [status, setStatus] = useState<{ type: "error" | "success" | null; msg: string }>({
    type: null,
    msg: "",
  });

  const detectPlatform = (inputUrl: string) => {
    const link = inputUrl.toLowerCase();
    if (link.includes("tiktok.com")) return { endpoint: "/api/tiktok", key: "tiktok_url", name: "TikTok" };
    if (link.includes("instagram.com")) return { endpoint: "/api/ig", key: "instagram_url", name: "Instagram" };
    if (link.includes("facebook.com") || link.includes("fb.watch")) return { endpoint: "/api/facebook", key: "facebook_url", name: "Facebook" };
    return null;
  };

  const handleDownload = async () => {
    if (!url) {
      setStatus({ type: "error", msg: "Tempel link terlebih dahulu!" });
      return;
    }
    
    const target = detectPlatform(url);
    if (!target) {
      setStatus({ type: "error", msg: "Platform tidak didukung!" });
      return;
    }

    setLoading(true);
    setDownloadResult(null); // Reset hasil sebelumnya
    setStatus({ type: null, msg: "" });

    try {
      const res = await fetch(target.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [target.key]: url }),
      });

      const data = await res.json();

      if (data.success && data.download_url) {
        setStatus({ type: "success", msg: "Video berhasil diproses! Klik tombol di bawah." });
        setDownloadResult(data.download_url); // Simpan link ke state
      } else {
        throw new Error(data.error || "Gagal mengambil data.");
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-glow-main text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="gradient-glow-content border-b border-slate-100/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-zinc-900 border-2 border-red-400/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-2xl overflow-hidden p-1.5 transition-all duration-500 group-hover:scale-105 group-hover:border-red-400">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-cover rounded-xl shadow-inner transition-all"
              />
            </div>
          <a
            href="https://ikonyek-dev.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 sm:px-6 py-2 border border-red-400 bg-red-500/20 text-xs sm:text-sm hover:bg-red-400/20 text-white rounded-2xl font-semibold transition-all active:scale-95 whitespace-nowrap"
          >
            ALL PROJECTS
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="gradient-glow-content flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full">
        
        {/* Hero Section */}
        <div className="text-center space-y-3 sm:space-y-4 pb-6 sm:pb-8 pt-4 sm:pt-0">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tight text-white uppercase">
            MILIM-MEDIA<span className="text-red-500">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium tracking-wide">
            BYPASS LIMITS • FAST DOWNLOADS
          </p>
        </div>

        {/* Input Field Area */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-2 backdrop-blur-sm shadow-2xl focus-within:border-red-500/50 transition-all">
            <div className="hidden sm:flex pl-4 pr-2">
              <LinkIcon className="w-5 h-5 text-zinc-600" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video link here..."
              className="flex-1 w-full sm:w-auto bg-transparent border-none focus:ring-0 py-3 sm:py-4 px-4 sm:px-0 text-sm sm:text-base text-zinc-200 outline-none"
            />
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"
            >
              {loading ? <Loader2 className="animate-spin w-4 sm:w-5 h-4 sm:h-5" /> : <Download className="w-4 sm:w-5 h-4 sm:h-5" />}
              {loading ? "" : "PROCESS"}
            </button>
          </div>
        </div>

        {/* Status & Download Result */}
        <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
          {status.type && (
            <div className={`p-3 sm:p-4 rounded-2xl flex items-center gap-2 sm:gap-3 border animate-in fade-in zoom-in duration-300 text-sm ${
              status.type === "error" ? "bg-red-500/5 border-red-500/20 text-red-500" : "bg-green-500/5 border-green-500/20 text-green-500"
            }`}>
              {status.type === "error" ? <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" /> : <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />}
              <span className="font-medium text-xs sm:text-sm">{status.msg}</span>
            </div>
          )}

          {/* TOMBOL HASIL DOWNLOAD (Muncul hanya jika sukses) */}
          {downloadResult && (
            <a 
              href={downloadResult} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all mt-3 sm:mt-4"
            >
              <ExternalLink className="w-4 sm:w-6 h-4 sm:h-6" />
              DOWNLOAD VIDEO
            </a>
          )}
        </div>

        {/* Platforms Footer */}
        <div className="flex justify-center items-center gap-6 sm:gap-10 pt-12 sm:pt-16 transition-all duration-500">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-zinc-600 hover:text-white transition-colors cursor-default">
            <Music2 className="w-5 sm:w-6 h-5 sm:h-6" />
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest">TIKTOK</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-zinc-600 hover:text-pink-500 transition-colors cursor-default">
            <IconInstagram />
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest">INSTAGRAM</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-zinc-600 hover:text-blue-500 transition-colors cursor-default">
            <IconFacebook />
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest">FACEBOOK</span>
          </div>
        </div>

        </div>
      </div>
    </main>
  );
}