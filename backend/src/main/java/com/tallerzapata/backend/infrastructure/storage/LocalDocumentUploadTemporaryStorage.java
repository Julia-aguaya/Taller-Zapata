package com.tallerzapata.backend.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class LocalDocumentUploadTemporaryStorage {
    private final Path uploadRoot;

    public LocalDocumentUploadTemporaryStorage(@Value("${app.storage.local-path}") String storagePath) {
        this.uploadRoot = Paths.get(storagePath).toAbsolutePath().normalize().resolve("uploads");
    }

    public String storeChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        Path target = chunkPath(uploadId, chunkIndex);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream input = chunk.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return checksum(target);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo guardar el chunk temporal", exception);
        }
    }

    public boolean matches(String uploadId, int chunkIndex, long size, String checksum) {
        Path path = chunkPath(uploadId, chunkIndex);
        try {
            return Files.exists(path) && Files.size(path) == size && checksum(path).equalsIgnoreCase(checksum);
        } catch (IOException exception) {
            return false;
        }
    }

    public InputStream assemble(String uploadId, int chunkCount) {
        try {
            java.io.SequenceInputStream result = null;
            java.util.Vector<InputStream> streams = new java.util.Vector<>();
            for (int index = 0; index < chunkCount; index++) {
                Path path = chunkPath(uploadId, index);
                if (!Files.isRegularFile(path)) {
                    streams.forEach(stream -> { try { stream.close(); } catch (IOException ignored) { } });
                    throw new IllegalStateException("Falta un chunk temporal");
                }
                streams.add(Files.newInputStream(path));
            }
            result = new java.io.SequenceInputStream(streams.elements());
            return result;
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo ensamblar la carga temporal", exception);
        }
    }

    public void delete(String uploadId) {
        Path directory = uploadDirectory(uploadId);
        if (!directory.startsWith(uploadRoot)) return;
        try {
            if (Files.exists(directory)) {
                try (var paths = Files.walk(directory)) {
                    paths.sorted(java.util.Comparator.reverseOrder()).forEach(path -> {
                        try { Files.deleteIfExists(path); } catch (IOException ignored) { }
                    });
                }
            }
        } catch (IOException ignored) {
            // Best effort cleanup; stale sessions are retried by the scheduled cleanup.
        }
    }

    private Path chunkPath(String uploadId, int chunkIndex) {
        return uploadDirectory(uploadId).resolve(chunkIndex + ".part").normalize();
    }

    private Path uploadDirectory(String uploadId) {
        if (uploadId == null || !uploadId.matches("[0-9a-fA-F-]{36}")) {
            throw new IllegalArgumentException("Identificador de carga invalido");
        }
        Path directory = uploadRoot.resolve(uploadId).normalize();
        if (!directory.startsWith(uploadRoot)) throw new IllegalArgumentException("Ruta temporal invalida");
        return directory;
    }

    private String checksum(Path path) throws IOException {
        try (InputStream input = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            for (int read; (read = input.read(buffer)) != -1; ) digest.update(buffer, 0, read);
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }
}
