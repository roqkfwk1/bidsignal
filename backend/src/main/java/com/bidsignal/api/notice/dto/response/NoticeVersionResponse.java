package com.bidsignal.api.notice.dto.response;

import com.bidsignal.api.notice.domain.Notice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeVersionResponse {

    private Long id;
    private String bidNtceOrd;
    private String ntceKindNm;
    private LocalDateTime rgstDt;
    private LocalDateTime bidClseDt;
    private LocalDateTime opengDt;

    public static NoticeVersionResponse from(Notice notice) {
        return NoticeVersionResponse.builder()
                .id(notice.getId())
                .bidNtceOrd(notice.getBidNtceOrd())
                .ntceKindNm(notice.getNtceKindNm())
                .rgstDt(notice.getRgstDt())
                .bidClseDt(notice.getBidClseDt())
                .opengDt(notice.getOpengDt())
                .build();
    }
}
