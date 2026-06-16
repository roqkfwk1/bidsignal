package com.bidsignal.api.notice.external.nara.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NaraBidNoticeResponse {

    private Response response; // 나라장터 API 전체 응답

    @JsonIgnore
    public boolean isSuccess() {

        return response != null && response.header != null && "00".equals(response.header.resultCode);
    }

    @JsonIgnore
    public String getResultCode() {

        if (response == null || response.header == null) {
            return null;
        }

        return response.header.resultCode;
    }

    @JsonIgnore
    public String getResultMsg() {

        if (response == null || response.header == null) {
            return null;
        }

        return response.header.resultMsg;
    }

    @JsonIgnore
    public List<NaraBidNoticeItem> getItems() {

        if (response == null || response.body == null || response.body.items == null) {
            return Collections.emptyList();
        }

        return response.body.items;
    }

    @JsonIgnore
    public Integer getTotalCount() {

        if (response == null || response.body == null) {
            return null;
        }

        return response.body.totalCount;
    }

    @JsonIgnore
    public Integer getPageNo() {

        if (response == null || response.body == null) {
            return null;
        }

        return response.body.pageNo;
    }

    @JsonIgnore
    public Integer getNumOfRows() {

        if (response == null || response.body == null) {
            return null;
        }

        return response.body.numOfRows;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {

        private Header header; // 응답 결과 정보
        private Body body;     // 응답 데이터 본문
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {

        private String resultCode; // 결과 코드
        private String resultMsg;  // 결과 메시지
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Body {

        private List<NaraBidNoticeItem> items; // 공고 목록
        private Integer numOfRows;             // 한 페이지 결과 수
        private Integer pageNo;                // 페이지 번호
        private Integer totalCount;            // 전체 결과 수
    }
}