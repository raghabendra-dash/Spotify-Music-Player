import { searchMusic } from "./music-api";
import type { Track } from "@shared/types";

export interface Genre {
  id: string;
  name: string;
  description: string;
  searchTerms: string[];
  color: string;
}

export const genres: Genre[] = [
  {
    id: "pop",
    name: "Pop",
    description: "Popular music hits",
    searchTerms: ["Taylor Swift", "Ariana Grande", "Ed Sheeran"],
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "bollywood",
    name: "Bollywood",
    description: "Bollywood hits and popular Hindi film songs",
    searchTerms: [
      "Arijit Singh",
      "Neha Kakkar",
      "Shreya Ghoshal",
      "Kookie",
      "Armaan Malik",
    ],
    color: "from-pink-500 to-red-500",
  },
  {
    id: "rock",
    name: "Rock",
    description: "Rock classics and modern hits",
    searchTerms: ["Queen", "The Beatles", "Led Zeppelin"],
    color: "from-red-500 to-orange-500",
  },
  {
    id: "indieosng",
    name: "South Indian",
    description: "Popular South Indian film songs and regional hits",
    searchTerms: [
      "Sid Sriram",
      "Anirudh Ravichander",
      "Devi Sri Prasad",
      "Harris Jayaraj",
      "Yuvan Shankar Raja",
    ],
    color: "from-amber-500 to-rose-500",
  },
  {
    id: "hip-hop",
    name: "Hip-Hop",
    description: "Rap and hip-hop tracks",
    searchTerms: ["Drake", "Kendrick Lamar", "Travis Scott"],
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "electronic",
    name: "Electronic",
    description: "Electronic and dance music",
    searchTerms: ["Calvin Harris", "David Guetta", "Deadmau5"],
    color: "from-purple-500 to-blue-500",
  },
  {
    id: "jazz",
    name: "Jazz",
    description: "Jazz classics and contemporary",
    searchTerms: ["Miles Davis", "John Coltrane", "Billie Holiday"],
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "country",
    name: "Country",
    description: "Country music hits",
    searchTerms: ["Luke Bryan", "Carrie Underwood", "Blake Shelton"],
    color: "from-yellow-500 to-green-500",
  },
  {
    id: "r&b",
    name: "R&B",
    description: "R&B and soul music",
    searchTerms: ["Beyonce", "The Weeknd", "John Legend"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "indie",
    name: "Indie",
    description: "Independent and alternative music",
    searchTerms: ["Arctic Monkeys", "Vampire Weekend", "Tame Impala"],
    color: "from-green-500 to-teal-500",
  },
];

export const musicCategories = [
  {
    id: "trending",
    name: "Trending Now",
    searchTerms: ["Billie Eilish", "Dua Lipa", "The Weeknd"],
  },
  {
    id: "new-releases",
    name: "New Releases",
    searchTerms: ["Olivia Rodrigo", "Bad Bunny", "SZA"],
  },
  {
    id: "top-charts",
    name: "Top Charts",
    searchTerms: ["Post Malone", "Harry Styles", "Adele"],
  },
  {
    id: "throwback",
    name: "Throwback Hits",
    searchTerms: ["Michael Jackson", "Whitney Houston", "Nirvana"],
  },
];

export async function getGenreMusic(
  genreId: string,
  limit: number = 20,
): Promise<Track[]> {
  const genre = genres.find((g) => g.id === genreId);
  if (!genre) return [];

  // Try multiple search terms with fallback
  for (const searchTerm of genre.searchTerms) {
    try {
      const result = await searchMusic(searchTerm, limit);
      if (result.results.length > 0) {
        return result.results;
      }
    } catch (error) {
      console.error(
        `Error fetching ${genre.name} music with term "${searchTerm}":`,
        error,
      );
      // Continue to next search term
    }
  }

  console.warn(`No results found for genre ${genre.name}`);
  return [];
}

export async function getCategoryMusic(
  categoryId: string,
  limit: number = 20,
): Promise<Track[]> {
  const category = musicCategories.find((c) => c.id === categoryId);
  if (!category) return [];

  // Try multiple search terms with fallback
  for (const searchTerm of category.searchTerms) {
    try {
      const result = await searchMusic(searchTerm, limit);
      if (result.results.length > 0) {
        return result.results;
      }
    } catch (error) {
      console.error(
        `Error fetching ${category.name} music with term "${searchTerm}":`,
        error,
      );
      // Continue to next search term
    }
  }

  console.warn(`No results found for category ${category.name}`);
  return [];
}

export async function getRecommendations(limit: number = 20): Promise<Track[]> {
  const recommendationTerms = [
    "Bruno Mars",
    "Rihanna",
    "Coldplay",
    "Maroon 5",
    "OneRepublic",
  ];

  try {
    const searchTerm =
      recommendationTerms[
        Math.floor(Math.random() * recommendationTerms.length)
      ];
    const result = await searchMusic(searchTerm, limit);
    return result.results;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}
