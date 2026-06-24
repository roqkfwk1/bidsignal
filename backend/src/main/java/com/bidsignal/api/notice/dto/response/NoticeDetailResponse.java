package com.bidsignal.api.notice.dto.response;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.domain.NoticeAttachment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class NoticeDetailResponse {

    private Long id;
    private String bidNtceNo;
    private String bidNtceOrd;
    private String bidNtceNm;
    private String ntceInsttNm;
    private String dminsttNm;
    private BidType bidType;
    private String ntceKindNm;
    private String reNtceYn;
    private String prtcptLmtRgnNm;
    private LocalDateTime bidNtceDt;
    private LocalDateTime bidBeginDt;
    private LocalDateTime bidClseDt;
    private LocalDateTime opengDt;
    private LocalDateTime rgstDt;
    private LocalDateTime chgDt;
    private Long bdgtAmt;
    private Long presmptPrce;
    private String cntrctCnclsMthdNm;
    private String bidMethdNm;
    private String sucsfbidMthdCd;
    private String sucsfbidMthdNm;
    private String sucsfbidMthdAppStd;
    private String techAbltEvlRt;
    private String bidPrceEvlRt;
    private String bidNtceDtlUrl;
    private List<NoticeAttachmentResponse> attachments;

    public static NoticeDetailResponse from(Notice notice, List<NoticeAttachment> attachments) {

        List<NoticeAttachmentResponse> attachmentResponses = attachments.stream()
                .map(NoticeAttachmentResponse::from)
                .toList();

        return NoticeDetailResponse.builder()
                .id(notice.getId())
                .bidNtceNo(notice.getBidNtceNo())
                .bidNtceOrd(notice.getBidNtceOrd())
                .bidNtceNm(notice.getBidNtceNm())
                .ntceInsttNm(notice.getNtceInsttNm())
                .dminsttNm(notice.getDminsttNm())
                .bidType(notice.getBidType())
                .ntceKindNm(notice.getNtceKindNm())
                .reNtceYn(notice.getReNtceYn())
                .prtcptLmtRgnNm(notice.getPrtcptLmtRgnNm())
                .bidNtceDt(notice.getBidNtceDt())
                .bidBeginDt(notice.getBidBeginDt())
                .bidClseDt(notice.getBidClseDt())
                .opengDt(notice.getOpengDt())
                .rgstDt(notice.getRgstDt())
                .chgDt(notice.getChgDt())
                .bdgtAmt(notice.getBdgtAmt())
                .presmptPrce(notice.getPresmptPrce())
                .cntrctCnclsMthdNm(notice.getCntrctCnclsMthdNm())
                .bidMethdNm(notice.getBidMethdNm())
                .sucsfbidMthdCd(notice.getSucsfbidMthdCd())
                .sucsfbidMthdNm(notice.getSucsfbidMthdNm())
                .sucsfbidMthdAppStd(notice.getSucsfbidMthdAppStd())
                .techAbltEvlRt(notice.getTechAbltEvlRt())
                .bidPrceEvlRt(notice.getBidPrceEvlRt())
                .bidNtceDtlUrl(notice.getBidNtceDtlUrl())
                .attachments(attachmentResponses)
                .build();
    }
}