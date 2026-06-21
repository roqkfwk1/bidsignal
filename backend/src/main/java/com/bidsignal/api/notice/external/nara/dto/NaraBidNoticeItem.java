package com.bidsignal.api.notice.external.nara.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NaraBidNoticeItem {

    // 공고 식별 정보
    private String bidNtceNo;              // 입찰공고번호
    private String bidNtceOrd;             // 입찰공고차수
    private String untyNtceNo;             // 통합공고번호
    private String reNtceYn;               // 재공고여부
    private String rgstTyNm;               // 등록유형명
    private String ntceKindNm;             // 공고종류명

    // 공고명 및 기관 정보
    private String bidNtceNm;              // 입찰공고명
    private String ntceInsttCd;            // 공고기관코드
    private String ntceInsttNm;            // 공고기관명
    private String dminsttCd;              // 수요기관코드
    private String dminsttNm;              // 수요기관명

    // 입찰 및 계약 방식 정보
    private String bidMethdNm;             // 입찰방식명
    private String cntrctCnclsMthdNm;      // 계약체결방법명
    private String sucsfbidMthdCd;         // 낙찰방법코드
    private String sucsfbidMthdNm;         // 낙찰방법명
    private String sucsfbidMthdAppStd;     // 낙찰방법적용기준
    private String techAbltEvlRt;          // 기술능력평가비율
    private String bidPrceEvlRt;           // 입찰가격평가비율

    // 입찰 일정 정보
    private String bidNtceDt;              // 입찰공고일시
    private String bidBeginDt;             // 입찰개시일시
    private String bidClseDt;              // 입찰마감일시
    private String opengDt;                // 개찰일시
    private String rgstDt;                 // 등록일시
    private String chgDt;                  // 변경일시
    private String bidQlfctRgstDt;         // 입찰참가자격등록마감일시
    private String rbidOpengDt;            // 재입찰개찰일시

    // 금액 및 평가 기준 정보
    private String asignBdgtAmt;           // 배정예산금액
    private String bdgtAmt;                // 예산금액
    private String presmptPrce;            // 추정가격
    private String VAT;                    // 부가가치세
    private String bidPrtcptFee;           // 입찰참가수수료
    private String sucsfbidLwltRate;       // 낙찰하한율

    // 지역 제한 정보
    private String prtcptLmtRgnCd;         // 참가제한지역코드
    private String prtcptLmtRgnNm;         // 참가제한지역명
    private String cnstrtsiteRgnNm;        // 공사현장지역명
    private String rgnLmtBidLocplcJdgmBssCd; // 지역제한입찰소재지판단기준코드
    private String rgnLmtBidLocplcJdgmBssNm; // 지역제한입찰소재지판단기준명

    // 참가 제한 및 공동수급 정보
    private String bidPrtcptLmtYn;         // 입찰참가제한여부
    private String indstrytyLmtYn;         // 업종제한여부
    private String rbidPermsnYn;           // 재입찰허용여부
    private String cmmnSpldmdMethdCd;      // 공동수급방식코드
    private String cmmnSpldmdMethdNm;      // 공동수급방식명
    private String cmmnSpldmdAgrmntRcptdocMethd; // 공동수급협정서접수방식
    private String cmmnSpldmdAgrmntClseDt; // 공동수급협정마감일시

    // 분류 정보
    private String srvceDivNm;             // 용역구분명
    private String ppswGnrlSrvceYn;        // 조달청 일반용역 여부
    private String infoBizYn;              // 정보화사업여부
    private String pubPrcrmntLrgClsfcNm;   // 공공조달대분류명
    private String pubPrcrmntMidClsfcNm;   // 공공조달중분류명
    private String pubPrcrmntClsfcNo;      // 공공조달분류번호
    private String pubPrcrmntClsfcNm;      // 공공조달분류명

    // 담당자 정보
    private String ntceInsttOfclNm;        // 공고기관담당자명
    private String ntceInsttOfclTelNo;     // 공고기관담당자전화번호
    private String ntceInsttOfclEmailAdrs; // 공고기관담당자이메일주소
    private String dminsttOfclEmailAdrs;   // 수요기관담당자이메일주소
    private String exctvNm;                // 집행관명

    // 공고 URL 정보
    private String bidNtceDtlUrl;          // 입찰공고상세URL
    private String bidNtceUrl;             // 입찰공고URL
    private String stdNtceDocUrl;          // 표준공고서URL

    // 첨부 문서 URL 정보
    private String ntceSpecDocUrl1;        // 공고규격서URL1
    private String ntceSpecDocUrl2;        // 공고규격서URL2
    private String ntceSpecDocUrl3;        // 공고규격서URL3
    private String ntceSpecDocUrl4;        // 공고규격서URL4
    private String ntceSpecDocUrl5;        // 공고규격서URL5
    private String ntceSpecDocUrl6;        // 공고규격서URL6
    private String ntceSpecDocUrl7;        // 공고규격서URL7
    private String ntceSpecDocUrl8;        // 공고규격서URL8
    private String ntceSpecDocUrl9;        // 공고규격서URL9
    private String ntceSpecDocUrl10;       // 공고규격서URL10

    // 첨부 문서 파일명 정보
    private String ntceSpecFileNm1;        // 공고규격파일명1
    private String ntceSpecFileNm2;        // 공고규격파일명2
    private String ntceSpecFileNm3;        // 공고규격파일명3
    private String ntceSpecFileNm4;        // 공고규격파일명4
    private String ntceSpecFileNm5;        // 공고규격파일명5
    private String ntceSpecFileNm6;        // 공고규격파일명6
    private String ntceSpecFileNm7;        // 공고규격파일명7
    private String ntceSpecFileNm8;        // 공고규격파일명8
    private String ntceSpecFileNm9;        // 공고규격파일명9
    private String ntceSpecFileNm10;       // 공고규격파일명10

    // 변경 공고 정보
    private String chgNtceRsn;             // 변경공고사유
}