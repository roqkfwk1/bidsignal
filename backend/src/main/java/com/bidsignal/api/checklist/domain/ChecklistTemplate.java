package com.bidsignal.api.checklist.domain;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;

import java.util.ArrayList;
import java.util.List;

public enum ChecklistTemplate {

    GENERAL,                    // 기본 템플릿
    SMALL_PRIVATE_CONTRACT,     // 소액수의/수의계약
    QUALIFICATION_REVIEW,       // 적격심사
    NEGOTIATION,                // 협상에 의한 계약
    SPEC_PRICE_EVALUATION,      // 규격가격/2단계 평가
    COMPREHENSIVE_EVALUATION;   // 종합심사/종합평가

    private static final String SUBMISSION_CHECK_ITEM = "입찰서 제출 마감 시각 및 제출방식(전자/우편/방문) 최종 확인";

    public static ChecklistTemplate from(Notice notice) {

        String sucsfbidMthdNm = value(notice.getSucsfbidMthdNm());
        String sucsfbidMthdAppStd = value(notice.getSucsfbidMthdAppStd());
        String cntrctCnclsMthdNm = value(notice.getCntrctCnclsMthdNm());

        // 협상형 공고
        if (contains(sucsfbidMthdNm, "협상") || contains(sucsfbidMthdAppStd, "협상")) {
            return NEGOTIATION;
        }

        // 종합평가형 공고
        if (contains(sucsfbidMthdNm, "종합심사")
                || contains(sucsfbidMthdNm, "종합평가")
                || contains(sucsfbidMthdAppStd, "종합심사")
                || contains(sucsfbidMthdAppStd, "종합평가")) {
            return COMPREHENSIVE_EVALUATION;
        }

        // 적격심사형 공고
        if (contains(sucsfbidMthdNm, "적격심사")
                || contains(sucsfbidMthdAppStd, "적격심사")) {
            return QUALIFICATION_REVIEW;
        }

        // 규격가격/2단계 평가형 공고
        if (contains(sucsfbidMthdNm, "규격가격")
                || contains(sucsfbidMthdNm, "2단계")
                || contains(sucsfbidMthdNm, "제안적격자")
                || contains(sucsfbidMthdAppStd, "규격가격")
                || contains(sucsfbidMthdAppStd, "2단계")
                || contains(sucsfbidMthdAppStd, "제안적격자")) {
            return SPEC_PRICE_EVALUATION;
        }

        // 소액수의/수의계약 공고
        if (contains(sucsfbidMthdNm, "수의") || contains(cntrctCnclsMthdNm, "수의")) {
            return SMALL_PRIVATE_CONTRACT;
        }

        return GENERAL;
    }

    public String getTitle() {

        if (this == NEGOTIATION) {
            return "협상에 의한 계약 준비 체크리스트";
        }

        if (this == QUALIFICATION_REVIEW) {
            return "적격심사 준비 체크리스트";
        }

        if (this == SMALL_PRIVATE_CONTRACT) {
            return "소액수의/수의계약 준비 체크리스트";
        }

        if (this == SPEC_PRICE_EVALUATION) {
            return "규격가격/2단계 평가 준비 체크리스트";
        }

        if (this == COMPREHENSIVE_EVALUATION) {
            return "종합심사/종합평가 준비 체크리스트";
        }

        return "기본 입찰 준비 체크리스트";
    }

    public String getGuideMessage(Notice notice) {

        String techAbltEvlRt = value(notice.getTechAbltEvlRt());
        String bidPrceEvlRt = value(notice.getBidPrceEvlRt());

        if (this == NEGOTIATION) {
            if (!techAbltEvlRt.isBlank() && !bidPrceEvlRt.isBlank()) {
                return "기술능력 " + techAbltEvlRt + "%, 가격 " + bidPrceEvlRt + "% 평가 공고입니다. 제안서와 실적자료를 우선 준비하세요.";
            }

            if (!techAbltEvlRt.isBlank()) {
                return "기술능력 평가비율이 " + techAbltEvlRt + "%인 공고입니다. 기술제안서와 실적자료를 우선 준비하세요.";
            }

            if (!bidPrceEvlRt.isBlank()) {
                return "입찰가격 평가비율이 " + bidPrceEvlRt + "%인 공고입니다. 가격제안서와 산출내역서를 함께 확인하세요.";
            }

            return "협상에 의한 계약 공고입니다. 기술제안서, 가격제안서, 발표자료를 중심으로 준비하세요.";
        }

        if (this == QUALIFICATION_REVIEW) {
            return "적격심사 대상 공고입니다. 실적증명서, 경영상태, 신용평가 서류를 미리 확인하세요.";
        }

        if (this == SMALL_PRIVATE_CONTRACT) {
            return "소액수의 또는 수의계약 공고입니다. 견적서, 참가자격, 지역제한 여부를 우선 확인하세요.";
        }

        if (this == SPEC_PRICE_EVALUATION) {
            return "규격 또는 제안 적격성 평가가 포함된 공고입니다. 규격서, 인증서, 기술 적합성 자료를 확인하세요.";
        }

        if (this == COMPREHENSIVE_EVALUATION) {
            return "종합심사 또는 종합평가 공고입니다. 실적, 기술능력, 신인도 평가자료를 함께 준비하세요.";
        }

        return "입찰공고문과 참가자격, 마감일을 먼저 확인하세요.";
    }

    public List<String> getDefaultItems(Notice notice) {

        List<String> items = new ArrayList<>();

        items.addAll(getCommonPrefixItems());
        items.addAll(getSpecificItems());

        addExtraItems(items, notice);

        items.add(SUBMISSION_CHECK_ITEM);

        return items;
    }

    private static List<String> getCommonPrefixItems() {

        List<String> items = new ArrayList<>();
        items.add("입찰공고문 확인");
        items.add("입찰참가자격 확인");
        items.add("나라장터 입찰참가등록 및 인증서 유효기간 확인");
        items.add("사업자등록증 준비");
        items.add("입찰보증금 납부방법 확인 (또는 면제 대상 여부 확인)");

        return items;
    }

    private List<String> getSpecificItems() {

        if (this == NEGOTIATION) {
            return List.of(
                    "제안요청서 확인",
                    "기술제안서 작성",
                    "가격제안서 작성",
                    "발표자료 준비",
                    "제안서 평가(발표) 일정 확인",
                    "실적증명서 준비",
                    "투입인력 및 수행조직 자료 준비"
            );
        }

        if (this == QUALIFICATION_REVIEW) {
            return List.of(
                    "적격심사 기준 확인",
                    "실적증명서 준비",
                    "경영상태 또는 신용평가 서류 준비",
                    "기술자 보유 증빙 확인",
                    "견적서 또는 산출내역서 준비"
            );
        }

        if (this == SMALL_PRIVATE_CONTRACT) {
            return List.of(
                    "견적서 제출",
                    "수의계약 배제사유 확인서 확인",
                    "청렴계약 이행서약서 확인"
            );
        }

        if (this == SPEC_PRICE_EVALUATION) {
            return List.of(
                    "규격서 또는 사양서 확인",
                    "제품 카탈로그 준비",
                    "시험성적서 또는 인증서 확인",
                    "기술규격 적합성 자료 준비",
                    "가격입찰서 제출"
            );
        }

        if (this == COMPREHENSIVE_EVALUATION) {
            return List.of(
                    "종합심사 또는 종합평가 기준 확인",
                    "시공실적 또는 수행실적 증명 준비",
                    "기술능력 평가자료 준비",
                    "신인도 및 사회적 책임 평가자료 확인",
                    "산출내역서 준비"
            );
        }

        return List.of(
                "견적서 또는 산출내역서 준비"
        );
    }

    private static void addExtraItems(List<String> items, Notice notice) {

        String prtcptLmtRgnNm = value(notice.getPrtcptLmtRgnNm());
        String cntrctCnclsMthdNm = value(notice.getCntrctCnclsMthdNm());
        String bidMethdNm = value(notice.getBidMethdNm());
        String sucsfbidMthdAppStd = value(notice.getSucsfbidMthdAppStd());
        String techAbltEvlRt = value(notice.getTechAbltEvlRt());
        String bidPrceEvlRt = value(notice.getBidPrceEvlRt());

        // 지역제한 조건
        if (!prtcptLmtRgnNm.isBlank()) {
            addIfNotExists(items, "지역제한 충족 여부 확인");
        }

        // 제한경쟁/지명경쟁 조건
        if (contains(cntrctCnclsMthdNm, "제한") || contains(cntrctCnclsMthdNm, "지명")) {
            addIfNotExists(items, "제한경쟁/지명경쟁 참가자격 증빙 확인");
        }

        // 우편 제출 조건
        if (contains(bidMethdNm, "우편")) {
            addIfNotExists(items, "우편 제출 서류 및 도착기한 확인");
        }

        // 방문 제출 조건
        if (contains(bidMethdNm, "직찰")) {
            addIfNotExists(items, "방문 제출 장소 및 제출서류 확인");
        }

        // 낙찰방법 적용기준
        if (!sucsfbidMthdAppStd.isBlank()) {
            addIfNotExists(items, "낙찰방법 적용기준 확인");
        }

        // 협상형 평가비율
        if (!techAbltEvlRt.isBlank() || !bidPrceEvlRt.isBlank()) {
            addIfNotExists(items, "기술능력/가격 평가비율 확인");
        }

        // 공사 공고 보조 항목
        if (notice.getBidType() == BidType.CONSTRUCTION) {
            addIfNotExists(items, "공사 관련 면허 및 실적 조건 확인");
        }

        // 물품 공고 보조 항목
        if (notice.getBidType() == BidType.GOODS) {
            addIfNotExists(items, "물품 규격 및 납품 조건 확인");
        }

        // 용역 공고 보조 항목
        if (notice.getBidType() == BidType.SERVICE) {
            addIfNotExists(items, "용역 수행범위 및 과업지시서 확인");
        }
    }

    private static void addIfNotExists(List<String> items, String title) {

        if (!items.contains(title)) {
            items.add(title);
        }
    }

    private static boolean contains(String value, String keyword) {

        return value.contains(keyword);
    }

    private static String value(String value) {

        if (value == null) {
            return "";
        }

        return value.trim();
    }
}