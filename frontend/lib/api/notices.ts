import { apiFetch } from '../api';
import type { NoticeListItem, NoticeDetail, NoticeSearchParams, PageResponse } from '@/types/notice';

export async function searchNotices(
  params: NoticeSearchParams
): Promise<PageResponse<NoticeListItem>> {
  const q = new URLSearchParams();
  if (params.keyword)           q.set('keyword', params.keyword);
  params.bidTypes?.forEach((t) => q.append('bidTypes', t));
  if (params.minAmt !== undefined) q.set('minAmt', String(params.minAmt));
  if (params.maxAmt !== undefined) q.set('maxAmt', String(params.maxAmt));
  if (params.bidClseDateFrom)        q.set('bidClseDateFrom', params.bidClseDateFrom);
  if (params.bidClseDateTo)          q.set('bidClseDateTo', params.bidClseDateTo);
  if (params.includeExpired === true) q.set('includeExpired', 'true');
  if (params.page !== undefined)     q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  if (params.sort)              q.set('sort', params.sort);

  const qs = q.toString();
  return apiFetch<PageResponse<NoticeListItem>>(`/notices${qs ? `?${qs}` : ''}`);
}

export async function getNotice(id: number): Promise<NoticeDetail> {
  return apiFetch<NoticeDetail>(`/notices/${id}`);
}
