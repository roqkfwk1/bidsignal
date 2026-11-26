alter table notices add column is_latest boolean not null default true;

-- 같은 공고번호에 더 높은 차수가 있는 행은 최신이 아니다.
update notices n
set is_latest = false
where exists (
    select 1
    from notices o
    where o.bid_ntce_no = n.bid_ntce_no
      and cast(o.bid_ntce_ord as integer) > cast(n.bid_ntce_ord as integer)
);
