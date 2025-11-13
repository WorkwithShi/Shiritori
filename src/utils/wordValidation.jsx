// src/utils/wordValidation.js
import localWordsData from "../data/words.json";

// Safely handle both array or object format
const localWords = Array.isArray(localWordsData)
  ? localWordsData.map(w => w.trim())
  : (Array.isArray(localWordsData.words) ? localWordsData.words.map(w => w.trim()) : []);

export async function isValidWord(word) {
  if (!word) return { valid: false, source: "error", details: "empty" };
  const w = word.trim();

  // Check local words (case-insensitive for safety)
  if (localWords.some(lw => lw.toLowerCase() === w.toLowerCase())) {
    return { valid: true, source: "local" };
  }

  // Jisho API check via codetabs proxy
  const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(w)}`;
  const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(jishoUrl)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("Proxy fetch failed", res.status);
      return { valid: false, source: "error", details: `proxy ${res.status}` };
    }

    const data = await res.json();
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      const found = data.data.some(entry =>
        Array.isArray(entry.japanese) && entry.japanese.some(j => j.word === w || j.reading === w)
      );
      return found ? { valid: true, source: "jisho" } : { valid: false, source: "not-found" };
    }

    return { valid: false, source: "not-found" };
  } catch (err) {
    console.error("WordValidation error:", err);
    return { valid: false, source: "error", details: err.name === "AbortError" ? "timeout" : err.message };
  }
}
