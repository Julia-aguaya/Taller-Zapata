package com.tallerzapata.backend.infrastructure.storage;

import com.tallerzapata.backend.application.document.DocumentStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalDocumentStorageService implements DocumentStorageService {

    private final Path storageRoot;

    public LocalDocumentStorageService(@Value("${app.storage.local-path}") String storagePath) {
        this.storageRoot = Paths.get(storagePath).toAbsolutePath().normalize();
    }

    @Override
    public StoredDocument store(MultipartFile file, String extension) {
        String normalizedExtension = extension == null || extension.isBlank() ? "bin" : extension;
        String storageKey = "documents/" + UUID.randomUUID() + "." + normalizedExtension;
        Path target = storageRoot.resolve(storageKey).normalize();

        try {
            Files.createDirectories(target.getParent());
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredDocument(storageKey.replace('\\', '/'), Files.size(target));
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo persistir el archivo en storage local", exception);
        }
    }

    @Override
    public Resource open(String storageKey) {
        Path target = storageRoot.resolve(storageKey).normalize();
        if (!Files.exists(target)) {
            throw new IllegalStateException("No existe el archivo solicitado en storage local");
        }
        return new FileSystemResource(target);
    }
}
