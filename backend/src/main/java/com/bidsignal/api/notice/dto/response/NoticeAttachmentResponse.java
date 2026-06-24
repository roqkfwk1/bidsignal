package com.bidsignal.api.notice.dto.response;

import com.bidsignal.api.notice.domain.NoticeAttachment;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NoticeAttachmentResponse {

    private Long id;
    private String fileName;
    private String fileUrl;

    public static NoticeAttachmentResponse from(NoticeAttachment attachment) {
        return NoticeAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .build();
    }
}