package com.bidsignal.api.notice.external.document;

import kr.dogfoot.hwplib.object.HWPFile;
import kr.dogfoot.hwplib.reader.HWPReader;
import kr.dogfoot.hwplib.tool.textextractor.TextExtractMethod;
import kr.dogfoot.hwplib.tool.textextractor.TextExtractor;
import kr.dogfoot.hwpxlib.object.HWPXFile;
import kr.dogfoot.hwpxlib.reader.HWPXReader;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Slf4j
@Component
public class NoticeDocumentExtractor {

    private final RestClient restClient;

    public NoticeDocumentExtractor() {
        this.restClient = RestClient.builder().build();
    }

    /**
     * 공고문 파일을 다운로드하고 파일 형식에 따라 본문 텍스트를 추출한다.
     */
    public String extractText(String fileUrl) {

        byte[] fileBytes = download(fileUrl);

        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        if (isHwp(fileBytes)) {
            return extractFromHwp(fileBytes);
        }

        if (isZip(fileBytes)) {
            return extractFromZipBased(fileBytes);
        }

        if (isPdf(fileBytes)) {
            return extractFromPdf(fileBytes);
        }

        log.warn("지원하지 않는 파일 형식입니다. fileUrl={}", fileUrl);
        return null;
    }

    private byte[] download(String fileUrl) {

        try {
            return restClient.get()
                    .uri(fileUrl)
                    .retrieve()
                    .body(byte[].class);

        } catch (Exception e) {
            log.error("공고문 파일 다운로드 실패. fileUrl={}, message={}", fileUrl, e.getMessage());
            return null;
        }
    }

    private boolean isHwp(byte[] bytes) {
        byte[] signature = {(byte) 0xD0, (byte) 0xCF, (byte) 0x11, (byte) 0xE0};
        return startsWith(bytes, signature);
    }

    private boolean isZip(byte[] bytes) {
        byte[] signature = {0x50, 0x4B};
        return startsWith(bytes, signature);
    }

    private boolean isPdf(byte[] bytes) {
        byte[] signature = {0x25, 0x50, 0x44, 0x46};
        return startsWith(bytes, signature);
    }

    private boolean startsWith(byte[] bytes, byte[] signature) {

        if (bytes.length < signature.length) {
            return false;
        }

        for (int i = 0; i < signature.length; i++) {
            if (bytes[i] != signature[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * HWP 파일에서 본문 텍스트를 추출한다.
     */
    private String extractFromHwp(byte[] bytes) {

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes)) {

            HWPFile hwpFile = HWPReader.fromInputStream(inputStream);

            return TextExtractor.extract(hwpFile, TextExtractMethod.InsertControlTextBetweenParagraphText);

        } catch (Exception e) {
            log.warn("HWP 텍스트 추출 실패. message={}", e.getMessage());
            return null;
        }
    }

    /**
     * HWPX 파일에서 본문 텍스트를 추출한다.
     * HWPXReader가 스트림 입력을 지원하지 않아 임시 파일로 저장한 뒤 읽는다.
     */
    private String extractFromHwpx(byte[] bytes) {

        File tempFile = null;

        try {
            tempFile = File.createTempFile("hwpx_", ".hwpx");

            try (FileOutputStream fileOutputStream = new FileOutputStream(tempFile)) {
                fileOutputStream.write(bytes);
            }

            HWPXFile hwpxFile = HWPXReader.fromFilepath(tempFile.getAbsolutePath());

            return kr.dogfoot.hwpxlib.tool.textextractor.TextExtractor.extract(
                    hwpxFile,
                    kr.dogfoot.hwpxlib.tool.textextractor.TextExtractMethod.InsertControlTextBetweenParagraphText,
                    true,
                    new kr.dogfoot.hwpxlib.tool.textextractor.TextMarks()
            );

        } catch (Exception e) {
            log.warn("HWPX 텍스트 추출 실패. message={}", e.getMessage());
            return null;

        } finally {
            if (tempFile != null && !tempFile.delete()) {
                log.warn("임시 파일 삭제 실패. path={}", tempFile.getAbsolutePath());
            }
        }
    }

    /**
     * ZIP 형식 파일을 처리한다.
     * 먼저 HWPX인지 확인하고, 아니면 내부에서 HWP, HWPX, PDF를 찾아 처리한다.
     */
    private String extractFromZipBased(byte[] bytes) {

        String hwpxResult = extractFromHwpx(bytes);

        if (hwpxResult != null) {
            return hwpxResult;
        }

        try (ZipInputStream zipInputStream = new ZipInputStream(new ByteArrayInputStream(bytes))) {

            ZipEntry entry;

            while ((entry = zipInputStream.getNextEntry()) != null) {

                if (entry.isDirectory()) {
                    continue;
                }

                byte[] entryBytes = zipInputStream.readAllBytes();

                if (isHwp(entryBytes)) {
                    return extractFromHwp(entryBytes);
                }

                if (isZip(entryBytes)) {
                    String innerHwpxResult = extractFromHwpx(entryBytes);

                    if (innerHwpxResult != null) {
                        return innerHwpxResult;
                    }

                    continue;
                }

                if (isPdf(entryBytes)) {
                    return extractFromPdf(entryBytes);
                }
            }

            return null;

        } catch (IOException e) {
            log.warn("ZIP 기반 파일 텍스트 추출 실패. message={}", e.getMessage());
            return null;
        }
    }

    /**
     * PDF 파일에서 본문 텍스트를 추출한다.
     */
    private String extractFromPdf(byte[] bytes) {

        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);

        } catch (Exception e) {
            log.warn("PDF 텍스트 추출 실패. message={}", e.getMessage());
            return null;
        }
    }
}