package com.bidsignal.api.watchlist.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WatchlistMemoUpdateRequest {

    @Size(max = 1000, message = "메모는 1000자 이하로 입력해주세요.")
    private String memo;
}