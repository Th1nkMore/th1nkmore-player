import type { Song } from "@/types/music";

function createSong(overrides: Partial<Song>): Song {
  return {
    id: "song-1",
    title: "Song One",
    artist: "Artist",
    album: "Album",
    duration: 180,
    lyrics: "[00:01.00]Line one",
    audioUrl: "https://cdn.example.com/song-1.mp3",
    metadata: {},
    language: "en",
    ...overrides,
  };
}

export const songOne = createSong({
  id: "song-1",
  title: "Song One",
  audioUrl: "https://cdn.example.com/song-1.mp3",
});

export const songTwo = createSong({
  id: "song-2",
  title: "Song Two",
  audioUrl: "https://cdn.example.com/song-2.mp3",
});

export const songThree = createSong({
  id: "song-3",
  title: "Song Three",
  audioUrl: "https://cdn.example.com/song-3.mp3",
});
