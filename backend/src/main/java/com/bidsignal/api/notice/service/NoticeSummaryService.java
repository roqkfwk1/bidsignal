package com.bidsignal.api.notice.service;

import com.bidsignal.api.global.external.gemini.GeminiClient;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.external.document.NoticeDocumentExtractor;
import com.bidsignal.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeSummaryService {

    private final NoticeDocumentExtractor noticeDocumentExtractor;
    private final GeminiClient geminiClient;
    private final NoticeRepository noticeRepository;

    /**
     * 공고문 원문을 AI로 요약한다. 이미 저장된 요약이 있으면 그 값을 반환한다.
     */
    @Transactional
    public String getSummary(Long noticeId) {

        Notice notice = noticeRepository.findById(noticeId).orElseThrow();

        if (notice.getAiSummary() != null) {
            return notice.getAiSummary();
        }

        if (notice.getStdNtceDocUrl() == null || notice.getStdNtceDocUrl().isBlank()) {
            log.warn("공고문 URL이 없습니다. noticeId={}", notice.getId());
            return null;
        }

        String documentText = noticeDocumentExtractor.extractText(notice.getStdNtceDocUrl());

        if (documentText == null || documentText.isBlank()) {
            log.warn("공고문 텍스트 추출 실패. noticeId={}", notice.getId());
            return null;
        }

        String prompt = buildPrompt(documentText);
        String summary = geminiClient.generate(prompt, 0.2, 800);

        if (summary == null) {
            log.warn("AI 요약 생성 실패. noticeId={}", notice.getId());
            return null;
        }

        notice.updateAiSummary(summary);

        return summary;
    }

    private String buildPrompt(String documentText) {

        return """
            다음은 공공조달 입찰 공고문 원문입니다.
            
            %s
            
            이 공고에 참여하려는 업체 담당자가 원문을 다 읽지 않고도
            놓치면 안 되는, 이 공고에서만 특이하게 나타나는 내용만 정리해줘.
            
            아래 항목에 해당하는 내용이 원문에 있으면 포함하고, 없으면 생략해줘.
            - 참가자격 제한사항 (지역제한, 면허, 인증, 실적 요건 등)
            - 표준 서류 외에 이 공고에서 추가로 요구하는 제출서류
            - 현장설명회, 특정 자재/규격 지정 등 이 공고만의 특수 절차
            
            아래는 절대 포함하지 마:
            - 공고명, 금액, 마감일, 개찰일시 (다른 곳에 이미 표시됨)
            - 청렴계약, 뇌물금지 등 대부분의 공고에 공통으로 들어가는 표준 조항
            
            주어진 텍스트에 없는 내용은 추측하지 말고, 있는 내용만 정리해줘.
            분량은 정해두지 않을 테니, 특이사항 개수에 맞게 간결하게 작성해줘.
            """.formatted(documentText);
    }
}