import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Required with `output: "export"`: tells Next to render this route once at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: siteConfig.contentUpdated,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
