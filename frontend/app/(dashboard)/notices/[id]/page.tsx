import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NoticeDetailClient } from './NoticeDetailClient';
import { formatIsoDate } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';
import type { NoticeDetail } from '@/types/notice';

type PageProps = {
  params: Promise<{ id: string }>;
};

type NoticeFetchResult =
  | { kind: 'ok'; data: NoticeDetail }
  | { kind: 'not-found' }
  | { kind: 'error' };

/*
 * generateMetadata와 페이지가 같은 조회를 쓰도록 React cache()로 감싼다(같은 렌더 안에서는 한 번만 호출됨).
 * - id가 숫자가 아니거나 응답이 404면 'not-found' → 페이지에서 notFound() 호출
 * - 네트워크 오류나 5xx 등 일시적인 문제는 'error' → 기존처럼 페이지를 그대로 렌더해서
 *   NoticeDetailClient가 클라이언트에서 다시 조회/재시도하게 둔다 (일시 장애를 404로 만들지 않음)
 */
const fetchNoticeDetail = cache(async (id: string): Promise<NoticeFetchResult> => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return { kind: 'not-found' };

  try {
    const res = await fetch(`${BASE_URL}/notices/${numericId}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return { kind: 'not-found' };
    if (!res.ok) return { kind: 'error' };

    const json = (await res.json()) as { success?: boolean; data?: NoticeDetail };
    if (!json?.data) return { kind: 'error' };
    return { kind: 'ok', data: json.data };
  } catch {
    return { kind: 'error' };
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchNoticeDetail(id);

  if (result.kind !== 'ok') return {};

  const notice = result.data;
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
  const result = await fetchNoticeDetail(id);

  if (result.kind === 'not-found') notFound();

  return <NoticeDetailClient noticeId={Number(id)} />;
}
