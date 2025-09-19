import { RequestHandler } from "express";

const ITUNES_API_BASE = "https://itunes.apple.com/search";

async function safeItunesCall(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Ripple/1.0 (+https://example.com)",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `iTunes API request failed: ${response.status}${text ? " - " + text.slice(0, 200) : ""}`,
      );
    }

    const responseText = await response.text();

    if (!responseText) {
      throw new Error("iTunes API returned empty response");
    }

    if (/<\/?html/i.test(responseText)) {
      throw new Error(
        "iTunes API returned an HTML error page - search term may not be supported or request blocked",
      );
    }

    try {
      return JSON.parse(responseText);
    } catch (err) {
      throw new Error("Failed to parse iTunes response as JSON");
    }
  } catch (err) {
    console.error("safeItunesCall error:", err);
    throw err;
  }
}

export const searchMusic: RequestHandler = async (req, res) => {
  try {
    const { q: query, limit = "50" } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const params = new URLSearchParams({
      term: query,
      media: "music",
      entity: "song",
      limit: limit.toString(),
      explicit: "Yes",
    });

    const data = await safeItunesCall(`${ITUNES_API_BASE}?${params}`);

    // Filter and transform the data
    const filteredResults = data.results
      .filter((track: any) => track.kind === "song")
      .map((track: any) => ({
        trackId: track.trackId,
        trackName: track.trackName || "Unknown Track",
        artistName: track.artistName || "Unknown Artist",
        collectionName: track.collectionName || "Unknown Album",
        artworkUrl100: track.artworkUrl100 || "",
        artworkUrl60: track.artworkUrl60 || "",
        previewUrl: track.previewUrl || null,
        trackTimeMillis: track.trackTimeMillis || 0,
        releaseDate: track.releaseDate || "",
        country: track.country || "US",
        currency: track.currency || "USD",
        trackPrice: track.trackPrice || 0,
        collectionPrice: track.collectionPrice || 0,
      }));

    res.json({
      resultCount: filteredResults.length,
      results: filteredResults,
    });
  } catch (error) {
    console.error("Music search error:", error);
    // Rather than returning a 500 which surfaces to the client, return an empty result set
    // with a helpful message so the UI can continue functioning.
    res.json({
      resultCount: 0,
      results: [],
      error: "Failed to search music",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const searchArtists: RequestHandler = async (req, res) => {
  try {
    const { q: query, limit = "25" } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const params = new URLSearchParams({
      term: query,
      media: "music",
      entity: "musicArtist",
      limit: limit.toString(),
    });

    const data = await safeItunesCall(`${ITUNES_API_BASE}?${params}`);
    res.json(data);
  } catch (error) {
    console.error("Artist search error:", error);
    res.json({
      results: [],
      error: "Failed to search artists",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const searchAlbums: RequestHandler = async (req, res) => {
  try {
    const { q: query, limit = "25" } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const params = new URLSearchParams({
      term: query,
      media: "music",
      entity: "album",
      limit: limit.toString(),
    });

    const data = await safeItunesCall(`${ITUNES_API_BASE}?${params}`);
    res.json(data);
  } catch (error) {
    console.error("Album search error:", error);
    res.json({
      results: [],
      error: "Failed to search albums",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
