import type { HeroScene } from "./types";

/**
 * Data for the hero's "Code Smasher" 3D scene (a character breaking balls).
 * Ball captions are short names of technologies from the CV "Technical Skills" section
 * (see `skills.ts`: JavaScript, PHP, Python, CSS3, Web3, AI). The colours are decoration
 * only: each ball wears its technology's well-known brand colour.
 */
export const heroScene = {
  /** Root-relative paths into `public/` (domain root, no basePath). */
  model: "/models/code-smasher.glb",
  poster: {
    src: "/images/hero-scene-poster.webp",
    width: 512,
    height: 512,
  },
  labels: [
    { text: "JS", background: "#f7df1e", foreground: "#1d1d1d" },
    { text: "PHP", background: "#7a86b8", foreground: "#ffffff" },
    { text: "Python", background: "#3776ab", foreground: "#ffd43b" },
    { text: "CSS", background: "#2965f1", foreground: "#ffffff" },
    { text: "Web3", background: "#f6851b", foreground: "#ffffff" },
    { text: "AI", background: "#b052ff", foreground: "#ffffff" },
  ],
  playLabel: "Play scene",
} as const satisfies HeroScene;
