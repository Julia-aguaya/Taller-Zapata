package com.tallerzapata.backend.application.document;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentStorageService {

    StoredDocument store(MultipartFile file, String extension);

    Resource open(String storageKey);

    record StoredDocument(String storageKey, long sizeBytes) {
    }
}
