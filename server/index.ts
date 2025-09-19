import "dotenv/config";
import express from "express";
import cors from "cors";
import { searchMusic, searchArtists, searchAlbums } from "./routes/music";

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

  return app;
}
