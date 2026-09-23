package com.tallerzapata.backend.api.document;

import java.time.LocalDateTime;

public record DocumentUploadSessionResponse(String uploadId, int chunkCount, int nextChunk, long receivedBytes, String status, LocalDateTime expiresAt, Long documentId) { }
