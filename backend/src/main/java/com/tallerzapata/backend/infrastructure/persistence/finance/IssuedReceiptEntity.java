package com.tallerzapata.backend.infrastructure.persistence.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "comprobantes_emitidos")
public class IssuedReceiptEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;
    @Column(name = "caso_id", nullable = false)
    private Long caseId;
    @Column(name = "tipo_comprobante_codigo", nullable = false)
    private String receiptTypeCode;
    @Column(name = "numero_comprobante", nullable = false)
    private String receiptNumber;
    @Column(name = "razon_social_receptor", nullable = false)
    private String receiverBusinessName;
    @Column(name = "fecha_emision", nullable = false)
    private LocalDate issuedDate;
    @Column(name = "neto_gravado", nullable = false)
    private BigDecimal taxableNet;
    @Column(name = "iva", nullable = false)
    private BigDecimal vatAmount;
    @Column(name = "total", nullable = false)
    private BigDecimal total;
    @Column(name = "firmado_conforme_en")
    private LocalDateTime signedAt;
    @Column(name = "notas")
    private String notes;
    @Column(name = "documento_id")
    private Long documentId;
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist void prePersist() { if (publicId == null) { publicId = UUID.randomUUID().toString(); } }
    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getReceiptTypeCode() { return receiptTypeCode; }
    public void setReceiptTypeCode(String receiptTypeCode) { this.receiptTypeCode = receiptTypeCode; }
    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
    public String getReceiverBusinessName() { return receiverBusinessName; }
    public void setReceiverBusinessName(String receiverBusinessName) { this.receiverBusinessName = receiverBusinessName; }
    public LocalDate getIssuedDate() { return issuedDate; }
    public void setIssuedDate(LocalDate issuedDate) { this.issuedDate = issuedDate; }
    public BigDecimal getTaxableNet() { return taxableNet; }
    public void setTaxableNet(BigDecimal taxableNet) { this.taxableNet = taxableNet; }
    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public LocalDateTime getSignedAt() { return signedAt; }
    public void setSignedAt(LocalDateTime signedAt) { this.signedAt = signedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
