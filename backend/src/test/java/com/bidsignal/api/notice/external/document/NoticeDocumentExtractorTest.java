package com.bidsignal.api.notice.external.document;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class NoticeDocumentExtractorTest {

    @Autowired
    NoticeDocumentExtractor extractor;

    @Test
    void extractText_hwpx() {

        String fileUrl = "https://www.g2b.go.kr/pn/pnp/pnpe/UntyAtchFile/downloadFile.do?bidPbancNo=R25BK00971911&bidPbancOrd=000&fileType=&fileSeq=1&prcmBsneSeCd=07";

        String result = extractor.extractText(fileUrl);

        assertThat(result).isNotBlank();
        System.out.println("길이: " + result.length());
        System.out.println(result);
    }

    @Test
    void extractText_hwp() {

        String fileUrl = "https://www.g2b.go.kr/pn/pnp/pnpe/UntyAtchFile/downloadFile.do?bidPbancNo=R25BK00969496&bidPbancOrd=000&fileType=&fileSeq=1&prcmBsneSeCd=07";

        String result = extractor.extractText(fileUrl);

        assertThat(result).isNotBlank();
        System.out.println("길이: " + result.length());
        System.out.println(result);
    }

    @Test
    void extractText_pdf() {

        String fileUrl = "https://www.g2b.go.kr/pn/pnp/pnpe/UntyAtchFile/downloadFile.do?bidPbancNo=R25BK00971402&bidPbancOrd=000&fileType=&fileSeq=2&prcmBsneSeCd=07";

        String result = extractor.extractText(fileUrl);

        assertThat(result).isNotBlank();
        System.out.println("길이: " + result.length());
        System.out.println(result);
    }
}