package com.bidsignal.api.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "nara.api")
@Getter
@Setter
public class NaraApiProperties {

    private String key;
    private String baseUrl;
}
