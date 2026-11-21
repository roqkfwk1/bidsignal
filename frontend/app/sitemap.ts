import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://bidsignal.kr";

  return [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/login`,
    },
    {
      url: `${baseUrl}/register`,
    },
  ];
}
