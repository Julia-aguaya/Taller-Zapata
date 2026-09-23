package com.tallerzapata.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TallerZapataBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TallerZapataBackendApplication.class, args);
    }
}
