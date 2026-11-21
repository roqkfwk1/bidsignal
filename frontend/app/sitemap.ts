import type { MetadataRoute } from "next";
import { searchNotices } from "@/lib/api/notices";

export const revalidate = 3600;

const BASE_URL = "https://bidsignal.kr";
const PAGE_SIZE = 200;
const MAX_URLS = 45000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/notices` },
    { url: `${BASE_URL}/privacy` },
    { url: `${BASE_URL}/terms` },
  ];

  const noticeRoutes: MetadataRoute.Sitemap = [];
  const noticeLimit = MAX_URLS - staticRoutes.length;

  let page = 0;
  while (noticeRoutes.length < noticeLimit) {
    let result;
    try {
      // includeExpired는 기본값(false) 유지
      result = await searchNotices({ page, size: PAGE_SIZE });
    } catch {
      // 호출이 한 번이라도 실패하면 그때까지 모은 주소만 반환
      break;
    }

    if (result.content.length === 0) break;

    for (const notice of result.content) {
      if (noticeRoutes.length >= noticeLimit) break;
      noticeRoutes.push({
        url: `${BASE_URL}/notices/${notice.id}`,
        ...(notice.bidNtceDt ? { lastModified: new Date(notice.bidNtceDt) } : {}),
      });
    }

    page += 1;
    if (page >= result.totalPages) break;
  }

  return [...staticRoutes, ...noticeRoutes];
}
