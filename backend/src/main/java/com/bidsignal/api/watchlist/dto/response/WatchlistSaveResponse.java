package com.bidsignal.api.watchlist.dto.response;

import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WatchlistSaveResponse {

    private Long watchlistItemId;
    private Long noticeId;
    private WatchlistStatus status;
    private LocalDateTime createdAt;

    public static WatchlistSaveResponse from(WatchlistItem watchlistItem) {
        return WatchlistSaveResponse.builder()
                .watchlistItemId(watchlistItem.getId())
                .noticeId(watchlistItem.getNotice().getId())
                .status(watchlistItem.getStatus())
                .createdAt(watchlistItem.getCreatedAt())
                .build();
    }
}