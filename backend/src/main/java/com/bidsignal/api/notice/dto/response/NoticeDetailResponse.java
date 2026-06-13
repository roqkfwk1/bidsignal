package com.bidsignal.api.notice.dto.response;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeDetailResponse {

    private Long id;
    private String bidNtceNo;
    private String bidNtceOrd;
    private String bidNtceNm;
    private String ntceInsttNm;
    private BidType bidType;
    private String prtcptLmtRgnNm;
    private LocalDateTime bidNtceDt;
    private LocalDateTime bidClseDt;
    private LocalDateTime rgstDt;
    private LocalDateTime chgDt;
    private Long bdgtAmt;
    private Long presmptPrce;
    private String cntrctCnclsMthdNm;
    private String bidMethdNm;
    private String bidNtceDtlUrl;

    public static NoticeDetailResponse from(Notice notice) {
        return NoticeDetailResponse.builder()
                .id(notice.getId())
                .bidNtceNo(notice.getBidNtceNo())
                .bidNtceOrd(notice.getBidNtceOrd())
                .bidNtceNm(notice.getBidNtceNm())
                .ntceInsttNm(notice.getNtceInsttNm())
                .bidType(notice.getBidType())
                .prtcptLmtRgnNm(notice.getPrtcptLmtRgnNm())
                .bidNtceDt(notice.getBidNtceDt())
                .bidClseDt(notice.getBidClseDt())
                .rgstDt(notice.getRgstDt())
                .chgDt(notice.getChgDt())
                .bdgtAmt(notice.getBdgtAmt())
                .presmptPrce(notice.getPresmptPrce())
                .cntrctCnclsMthdNm(notice.getCntrctCnclsMthdNm())
                .bidMethdNm(notice.getBidMethdNm())
                .bidNtceDtlUrl(notice.getBidNtceDtlUrl())
                .build();
    }
}