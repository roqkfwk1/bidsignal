import { notFound } from 'next/navigation';
import { mockNotices } from '@/data/mockNotices';
import { mockWatchlist } from '@/data/mockWatchlist';
import { NoticeDetailClient } from './NoticeDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const notice = mockNotices.find((n) => n.id === Number(id));
  if (!notice) notFound();

  const savedNotice = mockWatchlist.find((n) => n.id === Number(id));

  return (
    <NoticeDetailClient
      notice={notice}
      savedNotice={savedNotice}
    />
  );
}
