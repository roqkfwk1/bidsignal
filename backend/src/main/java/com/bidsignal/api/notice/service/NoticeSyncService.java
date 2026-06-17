package com.bidsignal.api.notice.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.response.NoticeSyncResponse;
import com.bidsignal.api.notice.external.nara.NaraBidNoticeClient;
import com.bidsignal.api.notice.external.nara.dto.NaraBidNoticeItem;
import com.bidsignal.api.notice.external.nara.dto.NaraBidNoticeResponse;
import com.bidsignal.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeSyncService {

    private static final int NUM_OF_ROWS = 100;
    private static final DateTimeFormatter NARA_DATE_TIME_WITH_SECONDS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter NARA_DATE_TIME_WITHOUT_SECONDS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final NaraBidNoticeClient naraBidNoticeClient;
    private final NoticeRepository noticeRepository;

    /**
     * 나라장터 입찰공고를 조회해서 DB에 저장한다.
     */
    public NoticeSyncResponse syncAllBidNotices(String beginDateTime, String endDateTime) {

        NoticeSyncResponse totalResult = new NoticeSyncResponse(0, 0, 0);

        List<BidType> bidTypes = List.of(
                BidType.GOODS,
                BidType.SERVICE,
                BidType.CONSTRUCTION,
                BidType.FOREIGN,
                BidType.ETC
        );

        for (BidType bidType : bidTypes) {
            NoticeSyncResponse result = syncBidNotices(bidType, beginDateTime, endDateTime);
            totalResult = totalResult.plus(result);
        }

        return totalResult;
    }

    /**
     * 공고유형 하나를 끝 페이지까지 조회해서 저장한다.
     */
    private NoticeSyncResponse syncBidNotices(BidType bidType, String beginDateTime, String endDateTime) {

        int pageNo = 1;
        int fetchedCount = 0;
        int savedCount = 0;
        int skippedCount = 0;

        while (true) {

            NaraBidNoticeResponse response = naraBidNoticeClient.fetchBidNotices(
                    bidType,
                    pageNo,
                    NUM_OF_ROWS,
                    beginDateTime,
                    endDateTime
            );

            if (response == null || !response.isSuccess()) {
                log.error(
                        "나라장터 API 호출 실패. bidType={}, pageNo={}, beginDateTime={}, endDateTime={}",
                        bidType, pageNo, beginDateTime, endDateTime
                );

                throw new BusinessException(ErrorCode.NARA_API_ERROR);
            }

            List<NaraBidNoticeItem> items = response.getItems();
            fetchedCount += items.size();

            for (NaraBidNoticeItem item : items) {

                if (!hasRequiredFields(item)) {
                    skippedCount++;
                    continue;
                }

                if (noticeRepository.existsByBidNtceNoAndBidNtceOrd(item.getBidNtceNo(), item.getBidNtceOrd())) {
                    skippedCount++;
                    continue;
                }

                Notice notice = toNotice(item, bidType);
                noticeRepository.save(notice);
                savedCount++;
            }

            Integer totalCount = response.getTotalCount();

            if (totalCount == null || totalCount == 0 || pageNo * NUM_OF_ROWS >= totalCount) {
                break;
            }

            pageNo++;
        }

        return new NoticeSyncResponse(fetchedCount, savedCount, skippedCount);
    }

    /**
     * 나라장터 공고 1건을 Notice Entity로 변환한다.
     */
    private Notice toNotice(NaraBidNoticeItem item, BidType bidType) {

        LocalDateTime rgstDt = parseDateTime(item.getRgstDt());

        if (rgstDt == null) {
            rgstDt = parseDateTime(item.getBidNtceDt());
        }

        if (rgstDt == null) {
            rgstDt = LocalDateTime.now();
        }

        String budgetAmount = item.getBdgtAmt();

        if (hasText(item.getAsignBdgtAmt())) {
            budgetAmount = item.getAsignBdgtAmt();
        }

        return Notice.builder()
                .bidNtceNo(item.getBidNtceNo())
                .bidNtceOrd(item.getBidNtceOrd())
                .bidNtceNm(item.getBidNtceNm())
                .ntceInsttNm(item.getNtceInsttNm())
                .dminsttNm(item.getDminsttNm())
                .bidType(bidType)
                .ntceKindNm(item.getNtceKindNm())
                .reNtceYn(item.getReNtceYn())
                .prtcptLmtRgnNm(item.getPrtcptLmtRgnNm())
                .bidNtceDt(parseDateTime(item.getBidNtceDt()))
                .bidBeginDt(parseDateTime(item.getBidBeginDt()))
                .bidClseDt(parseDateTime(item.getBidClseDt()))
                .opengDt(parseDateTime(item.getOpengDt()))
                .rgstDt(rgstDt)
                .chgDt(parseDateTime(item.getChgDt()))
                .bdgtAmt(parseLong(budgetAmount))
                .presmptPrce(parseLong(item.getPresmptPrce()))
                .cntrctCnclsMthdNm(item.getCntrctCnclsMthdNm())
                .bidMethdNm(item.getBidMethdNm())
                .bidNtceDtlUrl(item.getBidNtceDtlUrl())
                .build();
    }

    /**
     * 나라장터 날짜 문자열을 LocalDateTime으로 바꾼다.
     */
    private LocalDateTime parseDateTime(String value) {

        if (!hasText(value)) {
            return null;
        }

        String trimmedValue = value.trim();

        try {
            return LocalDateTime.parse(trimmedValue, NARA_DATE_TIME_WITH_SECONDS);
        } catch (DateTimeParseException e) {
            return LocalDateTime.parse(trimmedValue, NARA_DATE_TIME_WITHOUT_SECONDS);
        }
    }

    /**
     * 숫자 문자열을 Long으로 바꾼다.
     */
    private Long parseLong(String value) {

        if (!hasText(value)) {
            return null;
        }

        return Long.parseLong(value.trim());
    }

    /**
     * 값이 비어있지 않은지 확인한다.
     */
    private boolean hasText(String value) {

        return value != null && !value.isBlank();
    }

    /**
     * DB 저장에 필요한 필수값이 있는지 확인한다.
     */
    private boolean hasRequiredFields(NaraBidNoticeItem item) {

        return item != null
                && hasText(item.getBidNtceNo())
                && hasText(item.getBidNtceOrd())
                && hasText(item.getBidNtceNm())
                && hasText(item.getNtceInsttNm());
    }
}