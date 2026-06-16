package com.bidsignal.api.notice.external.nara;

import com.bidsignal.api.global.config.NaraApiProperties;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.external.nara.dto.NaraBidNoticeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class NaraBidNoticeClient {

    private final NaraApiProperties naraApiProperties;

    /**
     * 공고유형과 조회기간으로 나라장터 입찰공고를 조회한다.
     */
    public NaraBidNoticeResponse fetchBidNotices(BidType bidType, int pageNo, int numOfRows, String beginDateTime, String endDateTime) {

        String operationPath = switch (bidType) {
            case GOODS -> "/getBidPblancListInfoThng";
            case SERVICE -> "/getBidPblancListInfoServc";
            case CONSTRUCTION -> "/getBidPblancListInfoCnstwk";
            case FOREIGN -> "/getBidPblancListInfoFrgcpt";
            case ETC -> "/getBidPblancListInfoEtc";
        };

        RestClient restClient = RestClient.builder()
                .baseUrl(naraApiProperties.getBaseUrl())
                .build();

        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(operationPath)
                        .queryParam("ServiceKey", naraApiProperties.getKey()) // 공공데이터포털 인증키
                        .queryParam("pageNo", pageNo)
                        .queryParam("numOfRows", numOfRows)
                        .queryParam("type", "json")
                        .queryParam("inqryDiv", "1") // 등록일시 기준 조회
                        .queryParam("inqryBgnDt", beginDateTime)
                        .queryParam("inqryEndDt", endDateTime)
                        .build())
                .retrieve()
                .body(NaraBidNoticeResponse.class);
    }
}