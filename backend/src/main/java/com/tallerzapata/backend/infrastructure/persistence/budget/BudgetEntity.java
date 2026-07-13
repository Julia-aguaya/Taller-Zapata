package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "presupuestos")
public class BudgetEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "sucursal_id", nullable = false)
    private Long branchId;

    @Column(name = "fecha_presupuesto", nullable = false)
    private LocalDate budgetDate;

    @Column(name = "informe_estado_codigo", nullable = false)
    private String reportStatusCode;

    @Column(name = "mano_obra_sin_iva", nullable = false)
    private BigDecimal laborWithoutVat;

    @Column(name = "alicuota_iva", nullable = false)
    private BigDecimal vatRate;

    @Column(name = "mano_obra_iva", nullable = false)
    private BigDecimal laborVat;

    @Column(name = "mano_obra_con_iva", nullable = false)
    private BigDecimal laborWithVat;

    @Column(name = "repuestos_total", nullable = false)
    private BigDecimal partsTotal;

    @Column(name = "total_cotizado", nullable = false)
    private BigDecimal totalQuoted;

    @Column(name = "dias_estimados")
    private Integer estimatedDays;

    @Column(name = "monto_minimo_cierre_mo")
    private BigDecimal minimumCloseAmount;

    @Column(name = "observaciones")
    private String observations;

    @Column(name = "autorizo_nombre")
    private String authorizedByName;

    @Column(name = "interesado_nombre")
    private String interestedName;

    @Column(name = "estiraje_bancada_aplica")
    private Boolean benchStraighteningApplies;

    @Column(name = "estiraje_bancada_detalle")
    private String benchStraighteningDetail;

    @Column(name = "alineacion_aplica")
    private Boolean alignmentApplies;

    @Column(name = "alineacion_detalle")
    private String alignmentDetail;

    @Column(name = "balanceo_aplica")
    private Boolean balancingApplies;

    @Column(name = "balanceo_detalle")
    private String balancingDetail;

    @Column(name = "recambio_cristales_aplica")
    private Boolean glassReplacementApplies;

    @Column(name = "recambio_cristales_detalle")
    private String glassReplacementDetail;

    @Column(name = "trabajos_electricos_aplica")
    private Boolean electricalWorkApplies;

    @Column(name = "trabajo_electrico_detalle")
    private String electricalDetail;

    @Column(name = "trabajos_mecanicos_aplica")
    private Boolean mechanicalWorkApplies;

    @Column(name = "trabajos_mecanicos_codigo")
    private String mechanicalWorkCode;

    @Column(name = "repuestos_cotizados_fecha")
    private LocalDate quotedPartsDate;

    @Column(name = "repuestos_cotizados_proveedor")
    private String quotedPartsSupplier;

    @Column(name = "version_actual", nullable = false)
    private Integer currentVersion;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDate getBudgetDate() { return budgetDate; }
    public void setBudgetDate(LocalDate budgetDate) { this.budgetDate = budgetDate; }
    public String getReportStatusCode() { return reportStatusCode; }
    public void setReportStatusCode(String reportStatusCode) { this.reportStatusCode = reportStatusCode; }
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
    public BigDecimal getTotalQuoted() { return totalQuoted; }
    public void setTotalQuoted(BigDecimal totalQuoted) { this.totalQuoted = totalQuoted; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }
    public BigDecimal getMinimumCloseAmount() { return minimumCloseAmount; }
    public void setMinimumCloseAmount(BigDecimal minimumCloseAmount) { this.minimumCloseAmount = minimumCloseAmount; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getAuthorizedByName() { return authorizedByName; }
    public void setAuthorizedByName(String authorizedByName) { this.authorizedByName = authorizedByName; }
    public String getInterestedName() { return interestedName; }
    public void setInterestedName(String interestedName) { this.interestedName = interestedName; }
    public Boolean getBenchStraighteningApplies() { return benchStraighteningApplies; }
    public void setBenchStraighteningApplies(Boolean benchStraighteningApplies) { this.benchStraighteningApplies = benchStraighteningApplies; }
    public String getBenchStraighteningDetail() { return benchStraighteningDetail; }
    public void setBenchStraighteningDetail(String benchStraighteningDetail) { this.benchStraighteningDetail = benchStraighteningDetail; }
    public Boolean getAlignmentApplies() { return alignmentApplies; }
    public void setAlignmentApplies(Boolean alignmentApplies) { this.alignmentApplies = alignmentApplies; }
    public String getAlignmentDetail() { return alignmentDetail; }
    public void setAlignmentDetail(String alignmentDetail) { this.alignmentDetail = alignmentDetail; }
    public Boolean getBalancingApplies() { return balancingApplies; }
    public void setBalancingApplies(Boolean balancingApplies) { this.balancingApplies = balancingApplies; }
    public String getBalancingDetail() { return balancingDetail; }
    public void setBalancingDetail(String balancingDetail) { this.balancingDetail = balancingDetail; }
    public Boolean getGlassReplacementApplies() { return glassReplacementApplies; }
    public void setGlassReplacementApplies(Boolean glassReplacementApplies) { this.glassReplacementApplies = glassReplacementApplies; }
    public String getGlassReplacementDetail() { return glassReplacementDetail; }
    public void setGlassReplacementDetail(String glassReplacementDetail) { this.glassReplacementDetail = glassReplacementDetail; }
    public Boolean getElectricalWorkApplies() { return electricalWorkApplies; }
    public void setElectricalWorkApplies(Boolean electricalWorkApplies) { this.electricalWorkApplies = electricalWorkApplies; }
    public String getElectricalDetail() { return electricalDetail; }
    public void setElectricalDetail(String electricalDetail) { this.electricalDetail = electricalDetail; }
    public Boolean getMechanicalWorkApplies() { return mechanicalWorkApplies; }
    public void setMechanicalWorkApplies(Boolean mechanicalWorkApplies) { this.mechanicalWorkApplies = mechanicalWorkApplies; }
    public String getMechanicalWorkCode() { return mechanicalWorkCode; }
    public void setMechanicalWorkCode(String mechanicalWorkCode) { this.mechanicalWorkCode = mechanicalWorkCode; }
    public LocalDate getQuotedPartsDate() { return quotedPartsDate; }
    public void setQuotedPartsDate(LocalDate quotedPartsDate) { this.quotedPartsDate = quotedPartsDate; }
    public String getQuotedPartsSupplier() { return quotedPartsSupplier; }
    public void setQuotedPartsSupplier(String quotedPartsSupplier) { this.quotedPartsSupplier = quotedPartsSupplier; }
    public Integer getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(Integer currentVersion) { this.currentVersion = currentVersion; }
}
