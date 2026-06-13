package com.bidsignal.api.watchlist.dto.request;

import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WatchlistStatusUpdateRequest {

    @NotNull(message = "관심공고 상태는 필수입니다.")
    private WatchlistStatus status;
}