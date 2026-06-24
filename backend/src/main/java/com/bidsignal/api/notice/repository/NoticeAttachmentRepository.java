package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.NoticeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment, Long> {

    // 공고의 첨부파일 목록 조회
    List<NoticeAttachment> findByNoticeId(Long noticeId);
}