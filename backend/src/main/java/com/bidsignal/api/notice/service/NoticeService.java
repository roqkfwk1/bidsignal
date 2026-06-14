package com.bidsignal.api.notice.service;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.bidsignal.api.notice.dto.response.NoticeDetailResponse;
import com.bidsignal.api.notice.dto.response.NoticeListResponse;
import com.bidsignal.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // 공고 목록 조회
    public Page<NoticeListResponse> search(NoticeSearchRequest request, Pageable pageable) {

        return noticeRepository.search(request, pageable)
                .map(NoticeListResponse::from);
    }

    // 공고 상세 조회
    public NoticeDetailResponse getNotice(Long id) {

        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다. id=" + id));

        return NoticeDetailResponse.from(notice);
    }
}