package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "caso_tramitacion_seguro")
public class InsuranceProcessingEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "fecha_presentacion") private LocalDate presentedAt;
    @Column(name = "fecha_derivado_inspeccion") private LocalDate inspectionForwardedAt;
    @Column(name = "modalidad_codigo") private String modalityCode;
    @Column(name = "dictamen_codigo") private String opinionCode;
    @Column(name = "cotizacion_estado_codigo") private String quotationStatusCode;
    @Column(name = "fecha_cotizacion") private LocalDate quotationDate;
    @Column(name = "monto_acordado") private BigDecimal agreedAmount;
    @Column(name = "monto_minimo_cierre") private BigDecimal minimumCloseAmount;
    @Column(name = "lleva_repuestos", nullable = false) private Boolean includesParts;
    @Column(name = "autorizacion_repuestos_codigo") private String partsAuthorizationCode;
    @Column(name = "proveedor_repuestos_texto") private String partsSupplierText;
    @Column(name = "monto_facturar_compania") private BigDecimal amountToBillCompany;
    @Column(name = "monto_final_favor_taller") private BigDecimal finalAmountForWorkshop;
    @Column(name = "no_repara", nullable = false) private Boolean noRepair;
    @Column(name = "admin_override_turno", nullable = false) private Boolean adminOverrideAppointment;
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public LocalDate getPresentedAt() { return presentedAt; }
    public void setPresentedAt(LocalDate presentedAt) { this.presentedAt = presentedAt; }
    public LocalDate getInspectionForwardedAt() { return inspectionForwardedAt; }
    public void setInspectionForwardedAt(LocalDate inspectionForwardedAt) { this.inspectionForwardedAt = inspectionForwardedAt; }
    public String getModalityCode() { return modalityCode; }
    public void setModalityCode(String modalityCode) { this.modalityCode = modalityCode; }
    public String getOpinionCode() { return opinionCode; }
    public void setOpinionCode(String opinionCode) { this.opinionCode = opinionCode; }
    public String getQuotationStatusCode() { return quotationStatusCode; }
    public void setQuotationStatusCode(String quotationStatusCode) { this.quotationStatusCode = quotationStatusCode; }
    public LocalDate getQuotationDate() { return quotationDate; }
    public void setQuotationDate(LocalDate quotationDate) { this.quotationDate = quotationDate; }
    public BigDecimal getAgreedAmount() { return agreedAmount; }
    public void setAgreedAmount(BigDecimal agreedAmount) { this.agreedAmount = agreedAmount; }
    public BigDecimal getMinimumCloseAmount() { return minimumCloseAmount; }
    public void setMinimumCloseAmount(BigDecimal minimumCloseAmount) { this.minimumCloseAmount = minimumCloseAmount; }
    public Boolean getIncludesParts() { return includesParts; }
    public void setIncludesParts(Boolean includesParts) { this.includesParts = includesParts; }
    public String getPartsAuthorizationCode() { return partsAuthorizationCode; }
    public void setPartsAuthorizationCode(String partsAuthorizationCode) { this.partsAuthorizationCode = partsAuthorizationCode; }
    public String getPartsSupplierText() { return partsSupplierText; }
    public void setPartsSupplierText(String partsSupplierText) { this.partsSupplierText = partsSupplierText; }
    public BigDecimal getAmountToBillCompany() { return amountToBillCompany; }
    public void setAmountToBillCompany(BigDecimal amountToBillCompany) { this.amountToBillCompany = amountToBillCompany; }
    public BigDecimal getFinalAmountForWorkshop() { return finalAmountForWorkshop; }
    public void setFinalAmountForWorkshop(BigDecimal finalAmountForWorkshop) { this.finalAmountForWorkshop = finalAmountForWorkshop; }
    public Boolean getNoRepair() { return noRepair; }
    public void setNoRepair(Boolean noRepair) { this.noRepair = noRepair; }
    public Boolean getAdminOverrideAppointment() { return adminOverrideAppointment; }
    public void setAdminOverrideAppointment(Boolean adminOverrideAppointment) { this.adminOverrideAppointment = adminOverrideAppointment; }
}
