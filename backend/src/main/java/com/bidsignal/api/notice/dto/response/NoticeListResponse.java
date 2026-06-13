package com.bidsignal.api.notice.dto.response;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeListResponse {

    private Long id;
    private String bidNtceNo;
    private String bidNtceOrd;
    private String bidNtceNm;
    private String ntceInsttNm;
    private BidType bidType;
    private String prtcptLmtRgnNm;
    private LocalDateTime bidClseDt;
    private Long bdgtAmt;
    private String bidNtceDtlUrl;

    public static NoticeListResponse from(Notice notice) {
        return NoticeListResponse.builder()
                .id(notice.getId())
                .bidNtceNo(notice.getBidNtceNo())
                .bidNtceOrd(notice.getBidNtceOrd())
                .bidNtceNm(notice.getBidNtceNm())
                .ntceInsttNm(notice.getNtceInsttNm())
                .bidType(notice.getBidType())
                .prtcptLmtRgnNm(notice.getPrtcptLmtRgnNm())
                .bidClseDt(notice.getBidClseDt())
                .bdgtAmt(notice.getBdgtAmt())
                .bidNtceDtlUrl(notice.getBidNtceDtlUrl())
                .build();
    }
}