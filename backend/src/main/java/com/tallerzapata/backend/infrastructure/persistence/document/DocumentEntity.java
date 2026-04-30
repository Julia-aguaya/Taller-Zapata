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
@Table(name = "documentos")
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "nombre_archivo", nullable = false)
    private String fileName;

    @Column(name = "extension")
    private String extension;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "tamano_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "checksum_sha256", nullable = false, columnDefinition = "char(64)")
    private String checksumSha256;

    @Column(name = "categoria_id", nullable = false)
    private Long categoryId;

    @Column(name = "subcategoria_codigo")
    private String subcategoryCode;

    @Column(name = "fecha_documento")
    private LocalDate documentDate;

    @Column(name = "subido_por", nullable = false)
    private Long uploadedBy;

    @Column(name = "origen_codigo", nullable = false)
    private String originCode;

    @Column(name = "observaciones")
    private String observations;

    @Column(name = "reemplaza_documento_id")
    private Long replacesDocumentId;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (active == null) {
            active = true;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getSubcategoryCode() { return subcategoryCode; }
    public void setSubcategoryCode(String subcategoryCode) { this.subcategoryCode = subcategoryCode; }
    public LocalDate getDocumentDate() { return documentDate; }
    public void setDocumentDate(LocalDate documentDate) { this.documentDate = documentDate; }
    public Long getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getOriginCode() { return originCode; }
    public void setOriginCode(String originCode) { this.originCode = originCode; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public Long getReplacesDocumentId() { return replacesDocumentId; }
    public void setReplacesDocumentId(Long replacesDocumentId) { this.replacesDocumentId = replacesDocumentId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
