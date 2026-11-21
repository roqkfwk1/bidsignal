import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/mypage",
        "/watchlist",
        "/alerts",
        "/settings",
        "/checklist",
        "/onboarding",
        "/login",
        "/register",
      ],
    },
    sitemap: "https://bidsignal.kr/sitemap.xml",
  };
}
