package com.bidsignal.api.watchlist.dto.response;

import com.bidsignal.api.checklist.domain.ChecklistProgress;
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

    private int checklistTotalCount;
    private int checklistCheckedCount;
    private int checklistProgressRate;

    public static WatchlistListResponse from(WatchlistItem watchlistItem, ChecklistProgress progress) {
        Notice notice = watchlistItem.getNotice();

        int totalCount = 0;
        int checkedCount = 0;
        int progressRate = 0;

        if (progress != null) {
            totalCount = progress.totalCount();
            checkedCount = progress.checkedCount();
            progressRate = progress.progressRate();
        }

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
                .checklistTotalCount(totalCount)
                .checklistCheckedCount(checkedCount)
                .checklistProgressRate(progressRate)
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