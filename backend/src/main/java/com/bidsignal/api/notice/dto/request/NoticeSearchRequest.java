package com.bidsignal.api.notice.dto.request;

import com.bidsignal.api.notice.domain.BidType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class NoticeSearchRequest {

    private String keyword;         // 공고명 키워드
    private BidType bidType;        // 공고유형 (공사/물품/용역/외자/기타)
    private String prtcptLmtRgnNm;  // 지역
    private Long minAmt;            // 최소금액
    private Long maxAmt;            // 최대금액

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate bidClseDateFrom;    // 입찰 마감일 검색 시작일
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate bidClseDateTo;      // 입찰 마감일 검색 종료일
}