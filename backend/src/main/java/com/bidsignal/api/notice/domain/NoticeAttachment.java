package com.bidsignal.api.notice.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notice_attachments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class NoticeAttachment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Column(length = 300)
    private String fileName;    // 첨부파일명

    @Column(nullable = false, length = 512)
    private String fileUrl;     // 나라장터 원본 파일 주소

    public static NoticeAttachment create(Notice notice, String fileName, String fileUrl) {
        NoticeAttachment attachment = new NoticeAttachment();
        attachment.notice = notice;
        attachment.fileName = fileName;
        attachment.fileUrl = fileUrl;
        return attachment;
    }
}