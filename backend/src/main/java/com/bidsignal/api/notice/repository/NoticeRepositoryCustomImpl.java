package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static com.bidsignal.api.notice.domain.QNotice.notice;

@RequiredArgsConstructor
public class NoticeRepositoryCustomImpl implements NoticeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Notice> search(NoticeSearchRequest request, Pageable pageable) {

        LocalDateTime now = LocalDateTime.now();

        List<Notice> content = queryFactory
                .selectFrom(notice)
                .where(
                        keywordContains(request.getKeyword()),
                        bidTypesIn(request.getBidTypes()),
                        regionContains(request.getPrtcptLmtRgnNm()),
                        minAmountGoe(request.getMinAmt()),
                        maxAmountLoe(request.getMaxAmt()),
                        deadlineFromGoe(request.getBidClseDateFrom()),
                        deadlineToLoe(request.getBidClseDateTo()),
                        notExpired(request.getIncludeExpired(), now)
                )
                .orderBy(toOrderSpecifiers(pageable.getSort(), request.getIncludeExpired(), now))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(notice.count())
                .from(notice)
                .where(
                        keywordContains(request.getKeyword()),
                        bidTypesIn(request.getBidTypes()),
                        regionContains(request.getPrtcptLmtRgnNm()),
                        minAmountGoe(request.getMinAmt()),
                        maxAmountLoe(request.getMaxAmt()),
                        deadlineFromGoe(request.getBidClseDateFrom()),
                        deadlineToLoe(request.getBidClseDateTo()),
                        notExpired(request.getIncludeExpired(), now)
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    /**
     * 요청받은 정렬 옵션을 QueryDSL 정렬 조건으로 변환한다.
     */
    private OrderSpecifier<?>[] toOrderSpecifiers(Sort sort, Boolean includeExpired, LocalDateTime now) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();

        if (Boolean.TRUE.equals(includeExpired)) {
            NumberExpression<Integer> expiredFlag = new CaseBuilder()
                    .when(notice.bidClseDt.isNull()).then(0)
                    .when(notice.bidClseDt.goe(now)).then(0)
                    .otherwise(1);

            orders.add(new OrderSpecifier<>(Order.ASC, expiredFlag));
        }

        boolean hasSort = false;

        for (Sort.Order order : sort) {
            Order direction = order.isAscending() ? Order.ASC : Order.DESC;
            String property = order.getProperty();

            switch (property) {
                case "bidClseDt" -> {
                    orders.add(new OrderSpecifier<>(direction, notice.bidClseDt).nullsLast());
                    hasSort = true;
                }
                case "bidNtceDt" -> {
                    orders.add(new OrderSpecifier<>(direction, notice.bidNtceDt).nullsLast());
                    hasSort = true;
                }
                case "bdgtAmt" -> {
                    orders.add(new OrderSpecifier<>(direction, notice.bdgtAmt).nullsLast());
                    hasSort = true;
                }
                case "createdAt" -> {
                    orders.add(new OrderSpecifier<>(direction, notice.createdAt).nullsLast());
                    hasSort = true;
                }
                default -> {
                    // 지원하지 않는 정렬 조건은 무시한다.
                }
            }
        }

        if (!hasSort) {
            orders.add(notice.bidNtceDt.desc().nullsLast());
            orders.add(notice.id.desc());
        }

        return orders.toArray(new OrderSpecifier[0]);
    }

    private BooleanExpression keywordContains(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        return notice.bidNtceNm.contains(keyword);
    }

    private BooleanExpression bidTypesIn(List<BidType> bidTypes) {
        if (bidTypes == null || bidTypes.isEmpty()) {
            return null;
        }

        return notice.bidType.in(bidTypes);
    }

    private BooleanExpression regionContains(String prtcptLmtRgnNm) {
        if (prtcptLmtRgnNm == null || prtcptLmtRgnNm.isBlank()) {
            return null;
        }

        return notice.prtcptLmtRgnNm.contains(prtcptLmtRgnNm);
    }

    private BooleanExpression minAmountGoe(Long minAmt) {
        if (minAmt == null) {
            return null;
        }

        return notice.bdgtAmt.goe(minAmt);
    }

    private BooleanExpression maxAmountLoe(Long maxAmt) {
        if (maxAmt == null) {
            return null;
        }

        return notice.bdgtAmt.loe(maxAmt);
    }

    private BooleanExpression deadlineFromGoe(LocalDate from) {
        if (from == null) {
            return null;
        }

        return notice.bidClseDt.goe(from.atStartOfDay());
    }

    private BooleanExpression deadlineToLoe(LocalDate to) {
        if (to == null) {
            return null;
        }

        return notice.bidClseDt.loe(to.atTime(LocalTime.MAX));
    }

    private BooleanExpression notExpired(Boolean includeExpired, LocalDateTime now) {
        if (Boolean.TRUE.equals(includeExpired)) {
            return null;
        }

        return notice.bidClseDt.isNull()
                .or(notice.bidClseDt.goe(now));
    }
}