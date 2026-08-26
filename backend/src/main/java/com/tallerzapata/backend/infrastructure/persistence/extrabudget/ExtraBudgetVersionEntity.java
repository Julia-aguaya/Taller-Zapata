package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "presupuesto_extra_versiones")
public class ExtraBudgetVersionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_extra_id", nullable = false) private Long extraBudgetId;
    @Column(name = "numero_version", nullable = false) private Integer versionNumber;
    @Enumerated(EnumType.STRING) @Column(name = "estado", nullable = false) private ExtraBudgetStatus status;
    @Column(name = "cliente_snapshot") private String customerSnapshot;
    @Column(name = "vehiculo_snapshot") private String vehicleSnapshot;
    @Column(name = "carpeta_snapshot") private String folderSnapshot;
    @Column(name = "mano_obra_sin_iva", nullable = false) private BigDecimal laborWithoutVat;
    @Column(name = "alicuota_iva", nullable = false) private BigDecimal vatRate;
    @Column(name = "mano_obra_iva", nullable = false) private BigDecimal laborVat;
    @Column(name = "mano_obra_con_iva", nullable = false) private BigDecimal laborWithVat;
    @Column(name = "repuestos_total", nullable = false) private BigDecimal partsTotal;
    @Column(name = "total", nullable = false) private BigDecimal total;
    @Column(name = "presented_at") private LocalDateTime presentedAt;
    @Column(name = "presented_by") private Long presentedBy;
    @Column(name = "accepted_at") private LocalDateTime acceptedAt;
    @Column(name = "accepted_by") private Long acceptedBy;
    @Column(name = "rejected_at") private LocalDateTime rejectedAt;
    @Column(name = "rejected_by") private Long rejectedBy;
    @Column(name = "rejection_reason") private String rejectionReason;
    @Column(name = "pdf_snapshot_json") private String pdfSnapshotJson;
    @Column(name = "mano_obra_general", nullable = false) private BigDecimal generalLaborAmount;
    @Column(name = "mano_obra_general_aplica_iva", nullable = false) private Boolean generalLaborVatApplies;
    @Column(name = "notas") private String notes;
    @Column(name = "confirmado_at") private LocalDateTime confirmedAt;
    @Column(name = "confirmado_by") private Long confirmedBy;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getExtraBudgetId() { return extraBudgetId; }
    public void setExtraBudgetId(Long extraBudgetId) { this.extraBudgetId = extraBudgetId; }
    public Integer getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }
    public ExtraBudgetStatus getStatus() { return status; }
    public void setStatus(ExtraBudgetStatus status) { this.status = status; }
    public String getCustomerSnapshot() { return customerSnapshot; }
    public void setCustomerSnapshot(String customerSnapshot) { this.customerSnapshot = customerSnapshot; }
    public String getVehicleSnapshot() { return vehicleSnapshot; }
    public void setVehicleSnapshot(String vehicleSnapshot) { this.vehicleSnapshot = vehicleSnapshot; }
    public String getFolderSnapshot() { return folderSnapshot; }
    public void setFolderSnapshot(String folderSnapshot) { this.folderSnapshot = folderSnapshot; }
    public BigDecimal getLaborWithoutVat() { return laborWithoutVat; }
    public void setLaborWithoutVat(BigDecimal laborWithoutVat) { this.laborWithoutVat = laborWithoutVat; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public BigDecimal getLaborVat() { return laborVat; }
    public void setLaborVat(BigDecimal laborVat) { this.laborVat = laborVat; }
    public BigDecimal getLaborWithVat() { return laborWithVat; }
    public void setLaborWithVat(BigDecimal laborWithVat) { this.laborWithVat = laborWithVat; }
    public BigDecimal getPartsTotal() { return partsTotal; }
    public void setPartsTotal(BigDecimal partsTotal) { this.partsTotal = partsTotal; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public LocalDateTime getPresentedAt() { return presentedAt; }
    public void setPresentedAt(LocalDateTime presentedAt) { this.presentedAt = presentedAt; }
    public Long getPresentedBy() { return presentedBy; }
    public void setPresentedBy(Long presentedBy) { this.presentedBy = presentedBy; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
    public Long getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(Long acceptedBy) { this.acceptedBy = acceptedBy; }
    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }
    public Long getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(Long rejectedBy) { this.rejectedBy = rejectedBy; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getPdfSnapshotJson() { return pdfSnapshotJson; }
    public void setPdfSnapshotJson(String pdfSnapshotJson) { this.pdfSnapshotJson = pdfSnapshotJson; }
    public BigDecimal getGeneralLaborAmount() { return generalLaborAmount; }
    public void setGeneralLaborAmount(BigDecimal generalLaborAmount) { this.generalLaborAmount = generalLaborAmount; }
    public Boolean getGeneralLaborVatApplies() { return generalLaborVatApplies; }
    public void setGeneralLaborVatApplies(Boolean generalLaborVatApplies) { this.generalLaborVatApplies = generalLaborVatApplies; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
    public Long getConfirmedBy() { return confirmedBy; }
    public void setConfirmedBy(Long confirmedBy) { this.confirmedBy = confirmedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
