import { NoticeDetailClient } from './NoticeDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <NoticeDetailClient noticeId={Number(id)} />;
}
