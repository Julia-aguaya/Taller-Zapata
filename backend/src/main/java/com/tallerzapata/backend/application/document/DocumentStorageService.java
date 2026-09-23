package com.tallerzapata.backend.application.document;

import java.io.InputStream;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentStorageService {

    StoredDocument store(MultipartFile file, String extension);

    StoredDocument store(InputStream inputStream, String extension);

    Resource open(String storageKey);

    void delete(String storageKey);

    record StoredDocument(String storageKey, long sizeBytes) {
    }
}
