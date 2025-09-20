import "dotenv/config";
import express from "express";
import cors from "cors";
import { searchMusic, searchArtists, searchAlbums } from "./routes/music";
import path from "path";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Music API routes
  app.get("/api/music/search", searchMusic);
  app.get("/api/music/artists", searchArtists);
  app.get("/api/music/albums", searchAlbums);

  // In production, serve the static files from the React app build
  if (process.env.NODE_ENV === "production") {
    const buildPath = path.resolve(__dirname, "../../dist/spa");
    app.use(express.static(buildPath));

    // For any request that doesn't match a static file or an API route,
    // serve the index.html file to enable client-side routing.
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.sendFile(path.join(buildPath, "index.html"));
    });
  }

  return app;
}
