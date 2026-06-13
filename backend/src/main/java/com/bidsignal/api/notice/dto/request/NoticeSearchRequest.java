package com.bidsignal.api.notice.dto.request;

import com.bidsignal.api.notice.domain.BidType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NoticeSearchRequest {

    private String keyword;         // 공고명 키워드
    private BidType bidType;        // 공고유형 (공사/물품/용역/외자/기타)
    private String prtcptLmtRgnNm;  // 지역
    private Long minAmt;            // 최소금액
    private Long maxAmt;            // 최대금액
    private int pageNo;             // 페이지 번호 (기본 1)
    private int numOfRows;          // 페이지당 결과 수 (기본 10)
}