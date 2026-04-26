package com.tallerzapata.backend.api.document;

import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

public class DocumentReplaceRequest {

    private MultipartFile file;
    private Long categoryId;
    private String subcategoryCode;
    private LocalDate documentDate;
    private String originCode;
    private String observations;

    public MultipartFile getFile() { return file; }
    public void setFile(MultipartFile file) { this.file = file; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getSubcategoryCode() { return subcategoryCode; }
    public void setSubcategoryCode(String subcategoryCode) { this.subcategoryCode = subcategoryCode; }
    public LocalDate getDocumentDate() { return documentDate; }
    public void setDocumentDate(LocalDate documentDate) { this.documentDate = documentDate; }
    public String getOriginCode() { return originCode; }
    public void setOriginCode(String originCode) { this.originCode = originCode; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
}
