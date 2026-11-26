create index idx_watchlist_items_notice_id on watchlist_items (notice_id);

alter table notification_histories add column notice_id bigint;

-- 관심 공고를 옮기기 전에 실제로 알림을 보낸 공고로 채운다.
update notification_histories h
set notice_id = w.notice_id
from watchlist_items w
where w.id = h.watchlist_item_id;

alter table notification_histories alter column notice_id set not null;

alter table notification_histories
    add constraint fk_notification_histories_notice_id foreign key (notice_id) references notices (id);

-- 이전 차수를 가리키는 관심 공고를 사용자별로 id가 가장 작은 한 건만 최신 차수로 옮긴다.
update watchlist_items w
set notice_id = l.id
from notices n
join notices l on l.bid_ntce_no = n.bid_ntce_no and l.is_latest = true
where w.notice_id = n.id
  and n.is_latest = false
  and w.id = (
      select min(w2.id)
      from watchlist_items w2
      join notices n2 on n2.id = w2.notice_id
      where w2.user_id = w.user_id
        and n2.bid_ntce_no = n.bid_ntce_no
  )
  and not exists (
      select 1
      from watchlist_items w3
      where w3.user_id = w.user_id
        and w3.notice_id = l.id
  );
