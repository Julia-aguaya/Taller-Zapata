package com.tallerzapata.backend.infrastructure.persistence.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documento_cargas")
public class DocumentUploadSessionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)") private String publicId;
    @Column(name = "caso_id") private Long caseId;
    @Column(name = "categoria_id", nullable = false) private Long categoryId;
    @Column(name = "nombre_archivo", nullable = false) private String fileName;
    @Column(name = "mime_type", nullable = false) private String mimeType;
    @Column(name = "tamano_bytes", nullable = false) private Long sizeBytes;
    @Column(name = "checksum_sha256", nullable = false, columnDefinition = "char(64)") private String checksumSha256;
    @Column(name = "cantidad_chunks", nullable = false) private Integer chunkCount;
    @Column(name = "siguiente_chunk", nullable = false) private Integer nextChunk;
    @Column(name = "bytes_recibidos", nullable = false) private Long receivedBytes;
    @Column(name = "subido_por", nullable = false) private Long uploadedBy;
    @Column(name = "origen_codigo", nullable = false) private String originCode;
    @Column(name = "observaciones") private String observations;
    @Column(name = "fecha_documento") private LocalDate documentDate;
    @Column(name = "estado", nullable = false) private String status;
    @Column(name = "documento_id") private Long documentId;
    @Column(name = "expira_at", nullable = false) private LocalDateTime expiresAt;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false, updatable = false) private LocalDateTime updatedAt;
    @PrePersist void prePersist() { if (publicId == null) publicId = UUID.randomUUID().toString(); }
    public Long getId() { return id; } public String getPublicId() { return publicId; } public Long getCaseId() { return caseId; } public void setCaseId(Long v) { caseId = v; }
    public Long getCategoryId() { return categoryId; } public void setCategoryId(Long v) { categoryId = v; } public String getFileName() { return fileName; } public void setFileName(String v) { fileName = v; }
    public String getMimeType() { return mimeType; } public void setMimeType(String v) { mimeType = v; } public Long getSizeBytes() { return sizeBytes; } public void setSizeBytes(Long v) { sizeBytes = v; }
    public String getChecksumSha256() { return checksumSha256; } public void setChecksumSha256(String v) { checksumSha256 = v; } public Integer getChunkCount() { return chunkCount; } public void setChunkCount(Integer v) { chunkCount = v; }
    public Integer getNextChunk() { return nextChunk; } public void setNextChunk(Integer v) { nextChunk = v; } public Long getReceivedBytes() { return receivedBytes; } public void setReceivedBytes(Long v) { receivedBytes = v; }
    public Long getUploadedBy() { return uploadedBy; } public void setUploadedBy(Long v) { uploadedBy = v; } public String getOriginCode() { return originCode; } public void setOriginCode(String v) { originCode = v; }
    public String getObservations() { return observations; } public void setObservations(String v) { observations = v; } public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public LocalDate getDocumentDate() { return documentDate; } public void setDocumentDate(LocalDate v) { documentDate = v; }
    public LocalDateTime getExpiresAt() { return expiresAt; } public void setExpiresAt(LocalDateTime v) { expiresAt = v; } public LocalDateTime getCreatedAt() { return createdAt; } public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getDocumentId() { return documentId; } public void setDocumentId(Long v) { documentId = v; }
}
