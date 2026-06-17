package com.bidsignal.api.watchlist.dto.response;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
@Builder
public class WatchlistListResponse {

    private Long watchlistItemId;

    private Long noticeId;
    private String bidNtceNo;
    private String bidNtceOrd;
    private String bidNtceNm;
    private String ntceInsttNm;
    private LocalDateTime bidClseDt;
    private WatchlistStatus status;
    private String memo;
    @JsonProperty("dDay")
    private Long dDay;

    public static WatchlistListResponse from(WatchlistItem watchlistItem) {
        Notice notice = watchlistItem.getNotice();

        return WatchlistListResponse.builder()
                .watchlistItemId(watchlistItem.getId())
                .noticeId(notice.getId())
                .bidNtceNo(notice.getBidNtceNo())
                .bidNtceOrd(notice.getBidNtceOrd())
                .bidNtceNm(notice.getBidNtceNm())
                .ntceInsttNm(notice.getNtceInsttNm())
                .bidClseDt(notice.getBidClseDt())
                .status(watchlistItem.getStatus())
                .memo(watchlistItem.getMemo())
                .dDay(calculateDDay(notice.getBidClseDt()))
                .build();
    }

    private static Long calculateDDay(LocalDateTime bidClseDt) {
        if (bidClseDt == null) {
            return null;
        }

        LocalDate today = LocalDate.now();
        LocalDate deadline = bidClseDt.toLocalDate();

        return ChronoUnit.DAYS.between(today, deadline);
    }
}