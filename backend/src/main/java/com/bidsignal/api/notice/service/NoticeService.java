package com.bidsignal.api.notice.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.domain.NoticeAttachment;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.bidsignal.api.notice.dto.response.NoticeDetailResponse;
import com.bidsignal.api.notice.dto.response.NoticeListResponse;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;

    // 공고 목록 조회
    public Page<NoticeListResponse> search(NoticeSearchRequest request, Pageable pageable) {

        return noticeRepository.search(request, pageable)
                .map(NoticeListResponse::from);
    }

    // 공고 상세 조회
    public NoticeDetailResponse getNotice(Long id) {

        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));

        List<NoticeAttachment> attachments = noticeAttachmentRepository.findByNoticeId(id);

        return NoticeDetailResponse.from(notice, attachments);
    }
}