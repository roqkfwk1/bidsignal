package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeRepositoryCustom {

    // 공고 조건 검색
    Page<Notice> search(NoticeSearchRequest request, Pageable pageable);
}
