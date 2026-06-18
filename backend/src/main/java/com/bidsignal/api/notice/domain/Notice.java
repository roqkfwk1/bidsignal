package com.bidsignal.api.notice.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notices",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notices_bid_ntce_no_ord",
                columnNames = {"bid_ntce_no", "bid_ntce_ord"}
        ),
        indexes = {
                @Index(name = "idx_notices_bid_type", columnList = "bid_type"),
                @Index(name = "idx_notices_bid_clse_dt", columnList = "bid_clse_dt"),
                @Index(name = "idx_notices_bid_ntce_dt", columnList = "bid_ntce_dt")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Notice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String bidNtceNo;           // 입찰공고번호

    @Column(nullable = false, length = 3)
    private String bidNtceOrd;          // 입찰공고차수

    @Column(nullable = false, length = 1000)
    private String bidNtceNm;           // 입찰공고명

    @Column(nullable = false, length = 400)
    private String ntceInsttNm;         // 공고기관명

    @Column(length = 400)
    private String dminsttNm;           // 수요기관명

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BidType bidType;            // 공고유형 (공사/물품/용역/외자/기타)

    @Column(length = 100)
    private String ntceKindNm;          // 공고종류명

    @Column(length = 1)
    private String reNtceYn;            // 재공고여부

    @Column(length = 200)
    private String prtcptLmtRgnNm;      // 참가제한지역명

    @Column
    private LocalDateTime bidNtceDt;    // 입찰공고일시

    @Column
    private LocalDateTime bidBeginDt;   // 입찰개시일시

    @Column
    private LocalDateTime bidClseDt;    // 입찰마감일시

    @Column
    private LocalDateTime opengDt;      // 개찰일시

    @Column(nullable = false)
    private LocalDateTime rgstDt;       // 등록일시

    private LocalDateTime chgDt;        // 변경일시

    private Long bdgtAmt;               // 예산금액

    private Long presmptPrce;           // 추정가격

    @Column(length = 500)
    private String cntrctCnclsMthdNm;   // 계약체결방법명

    @Column(length = 500)
    private String bidMethdNm;          // 입찰방식명

    @Column(length = 512)
    private String bidNtceDtlUrl;       // 입찰공고상세URL

    @Builder
    private Notice(
            String bidNtceNo,
            String bidNtceOrd,
            String bidNtceNm,
            String ntceInsttNm,
            String dminsttNm,
            BidType bidType,
            String ntceKindNm,
            String reNtceYn,
            String prtcptLmtRgnNm,
            LocalDateTime bidNtceDt,
            LocalDateTime bidBeginDt,
            LocalDateTime bidClseDt,
            LocalDateTime opengDt,
            LocalDateTime rgstDt,
            LocalDateTime chgDt,
            Long bdgtAmt,
            Long presmptPrce,
            String cntrctCnclsMthdNm,
            String bidMethdNm,
            String bidNtceDtlUrl
    ) {
        this.bidNtceNo = bidNtceNo;
        this.bidNtceOrd = bidNtceOrd;
        this.bidNtceNm = bidNtceNm;
        this.ntceInsttNm = ntceInsttNm;
        this.dminsttNm = dminsttNm;
        this.bidType = bidType;
        this.ntceKindNm = ntceKindNm;
        this.reNtceYn = reNtceYn;
        this.prtcptLmtRgnNm = prtcptLmtRgnNm;
        this.bidNtceDt = bidNtceDt;
        this.bidBeginDt = bidBeginDt;
        this.bidClseDt = bidClseDt;
        this.opengDt = opengDt;
        this.rgstDt = rgstDt;
        this.chgDt = chgDt;
        this.bdgtAmt = bdgtAmt;
        this.presmptPrce = presmptPrce;
        this.cntrctCnclsMthdNm = cntrctCnclsMthdNm;
        this.bidMethdNm = bidMethdNm;
        this.bidNtceDtlUrl = bidNtceDtlUrl;
    }
}