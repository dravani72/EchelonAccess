import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EchelonAccess",
    short_name: "EchelonAccess",
    description: "Private relationship intelligence for strategic access.",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    orientation: "any",
    icons: [
      {
        src: withBasePath("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: withBasePath("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
