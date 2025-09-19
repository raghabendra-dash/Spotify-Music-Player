import type { SearchResult, Track } from "@shared/types";

async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  retries = 2,
): Promise<Response> {
  // If offline, short-circuit and return a synthetic 502 response
  if (
    typeof navigator !== "undefined" &&
    navigator &&
    "onLine" in navigator &&
    !navigator.onLine
  ) {
    console.debug(
      "fetchWithRetry: navigator is offline, skipping fetch for",
      url,
    );
    const body = JSON.stringify({ error: "offline" });
    return new Response(body, {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure we use an absolute URL so service workers or other script shims do not break relative fetch scopes
  let absoluteUrl = url;
  try {
    absoluteUrl = new URL(
      url,
      typeof window !== "undefined" ? window.location.href : "http://localhost",
    ).toString();
  } catch (e) {}

  let attempt = 0;
  let lastError: any;
  while (attempt <= retries) {
    try {
      const resp = await fetch(absoluteUrl, opts);
      return resp;
    } catch (err) {
      lastError = err;
      attempt += 1;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  console.debug(
    "fetchWithRetry: all retries failed (network) for",
    absoluteUrl,
    lastError && (lastError.message || String(lastError)),
  );
  const body = JSON.stringify({
    error:
      lastError && lastError.message
        ? String(lastError.message)
        : "network_error",
  });
  return new Response(body, {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}

export async function searchMusic(
  query: string,
  limit: number = 50,
): Promise<SearchResult> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    // Try Spotify proxy first (metadata-only). If it returns results, use them; otherwise fallback to the existing iTunes proxy
    try {
      const spResp = await fetchWithRetry(`/api/music/spotify?${params}`);
      if (spResp.ok) {
        const spData = await spResp
          .json()
          .catch(() => ({ results: [] }) as any);
        if (Array.isArray(spData.results) && spData.results.length > 0) {
          // Prefer Spotify results that include a previewUrl. If none of the returned items
          // have a preview (common for some Spotify tracks), fall back to the iTunes proxy
          // which typically provides preview URLs.
          const withPreview = spData.results.filter((r: any) => !!r.previewUrl);
          if (withPreview.length > 0) {
            return { resultCount: withPreview.length, results: withPreview };
          }
          // else continue to fallback to iTunes below
        }
      }
    } catch (e) {}

    const response = await fetchWithRetry(`/api/music/search?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Music API returned non-ok response",
        response.status,
        errorData,
      );
      return { resultCount: 0, results: [] };
    }

    const data = await response.json().catch((err) => {
      console.error("Failed to parse music API JSON:", err);
      return { results: [] } as any;
    });

    return {
      resultCount: Array.isArray(data.results) ? data.results.length : 0,
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch (error) {
    console.error("Music search error (network/fetch):", error);
    // Network-level failure: return empty dataset so UI can fall back gracefully
    return { resultCount: 0, results: [] };
  }
}

export async function searchArtists(
  query: string,
  limit: number = 25,
): Promise<any> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetchWithRetry(`/api/music/artists?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Artists API returned non-ok response",
        response.status,
        errorData,
      );
      return { results: [] };
    }

    return await response.json().catch((err) => {
      console.error("Failed to parse artists JSON:", err);
      return { results: [] };
    });
  } catch (error) {
    console.error("Artist search error (network/fetch):", error);
    return { results: [] };
  }
}

export async function searchAlbums(
  query: string,
  limit: number = 25,
): Promise<any> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetchWithRetry(`/api/music/albums?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Albums API returned non-ok response",
        response.status,
        errorData,
      );
      return { results: [] };
    }

    return await response.json().catch((err) => {
      console.error("Failed to parse albums JSON:", err);
      return { results: [] };
    });
  } catch (error) {
    console.error("Album search error (network/fetch):", error);
    return { results: [] };
  }
}
