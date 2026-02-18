import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kana Trainer",
    short_name: "KanaTrainer",
    description: "Learn kana with SRS and emoji words",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#124559",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
