package com.bidsignal.api.notice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NoticeSyncResponse {

    private int fetchedCount; // 나라장터에서 조회한 공고 수
    private int savedCount;   // 새로 저장한 공고 수
    private int skippedCount; // 이미 존재해서 건너뛴 공고 수

    public NoticeSyncResponse plus(NoticeSyncResponse other) {
        return new NoticeSyncResponse(
                this.fetchedCount + other.fetchedCount,
                this.savedCount + other.savedCount,
                this.skippedCount + other.skippedCount
        );
    }
}