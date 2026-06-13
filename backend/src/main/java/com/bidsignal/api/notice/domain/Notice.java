package com.bidsignal.api.notice.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notices",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notices_bid_ntce_no_ord",
                columnNames = {"bid_ntce_no", "bid_ntce_ord"}
        )
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BidType bidType;            // 공고유형 (공사/물품/용역/외자/기타)

    @Column(length = 200)
    private String prtcptLmtRgnNm;     // 참가제한지역명

    @Column
    private LocalDateTime bidNtceDt;   // 입찰공고일시

    @Column
    private LocalDateTime bidClseDt;   // 입찰마감일시

    @Column(nullable = false)
    private LocalDateTime rgstDt;      // 등록일시

    private LocalDateTime chgDt;       // 변경일시

    private Long bdgtAmt;              // 예산금액

    private Long presmptPrce;          // 추정가격

    @Column(length = 500)
    private String cntrctCnclsMthdNm;  // 계약체결방법명

    @Column(length = 500)
    private String bidMethdNm;         // 입찰방식명

    @Column(length = 512)
    private String bidNtceDtlUrl;      // 입찰공고상세URL
}