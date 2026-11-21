import type { Metadata } from 'next';
import { NoticeDetailClient } from './NoticeDetailClient';
import { formatIsoDate } from '@/lib/utils';
import type { NoticeDetail } from '@/types/notice';

type PageProps = {
  params: Promise<{ id: string }>;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/* 메타데이터용 공고 조회. 실패/404/유효하지 않은 id는 null을 반환해서
   generateMetadata가 기본(루트 layout) 메타데이터로 폴백하게 한다. */
async function fetchNoticeForMetadata(id: string): Promise<NoticeDetail | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  try {
    const res = await fetch(`${BASE_URL}/notices/${numericId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { success?: boolean; data?: NoticeDetail };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await fetchNoticeForMetadata(id);

  if (!notice) return {};

  const agency = notice.dminsttNm || notice.ntceInsttNm;
  const deadline = formatIsoDate(notice.bidClseDt);
  const title = `${notice.bidNtceNm} - ${agency} | BidSignal`;
  const description = `"${notice.bidNtceNm}" 공고입니다. 발주기관: ${agency}, 입찰 마감일: ${deadline}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/notices/${id}`,
      siteName: 'BidSignal',
      locale: 'ko_KR',
      type: 'website',
    },
    alternates: {
      canonical: `/notices/${id}`,
    },
  };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <NoticeDetailClient noticeId={Number(id)} />;
}
