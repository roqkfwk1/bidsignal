package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static com.bidsignal.api.notice.domain.QNotice.notice;

@RequiredArgsConstructor
public class NoticeRepositoryCustomImpl implements NoticeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    // 공고 조건 검색
    @Override
    public Page<Notice> search(NoticeSearchRequest request, Pageable pageable) {
        List<Notice> content = queryFactory
                .selectFrom(notice)
                .where(
                        keywordContains(request.getKeyword()),
                        bidTypeEq(request.getBidType()),
                        regionContains(request.getPrtcptLmtRgnNm()),
                        minAmountGoe(request.getMinAmt()),
                        maxAmountLoe(request.getMaxAmt()),
                        deadlineFromGoe(request.getBidClseDateFrom()),
                        deadlineToLoe(request.getBidClseDateTo())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(notice.count())
                .from(notice)
                .where(
                        keywordContains(request.getKeyword()),
                        bidTypeEq(request.getBidType()),
                        regionContains(request.getPrtcptLmtRgnNm()),
                        minAmountGoe(request.getMinAmt()),
                        maxAmountLoe(request.getMaxAmt()),
                        deadlineFromGoe(request.getBidClseDateFrom()),
                        deadlineToLoe(request.getBidClseDateTo())
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    private BooleanExpression keywordContains(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        return notice.bidNtceNm.contains(keyword);
    }

    private BooleanExpression bidTypeEq(BidType bidType) {
        if (bidType == null) {
            return null;
        }

        return notice.bidType.eq(bidType);
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
}