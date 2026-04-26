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
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "organizacion_id", nullable = false) private Long organizationId;
    @Column(name = "sucursal_id", nullable = false) private Long branchId;
    @Column(name = "fecha_presupuesto", nullable = false) private LocalDate budgetDate;
    @Column(name = "informe_estado_codigo", nullable = false) private String reportStatusCode;
    @Column(name = "mano_obra_sin_iva", nullable = false) private BigDecimal laborWithoutVat;
    @Column(name = "alicuota_iva", nullable = false) private BigDecimal vatRate;
    @Column(name = "mano_obra_iva", nullable = false) private BigDecimal laborVat;
    @Column(name = "mano_obra_con_iva", nullable = false) private BigDecimal laborWithVat;
    @Column(name = "repuestos_total", nullable = false) private BigDecimal partsTotal;
    @Column(name = "total_cotizado", nullable = false) private BigDecimal totalQuoted;
    @Column(name = "dias_estimados") private Integer estimatedDays;
    @Column(name = "monto_minimo_cierre_mo") private BigDecimal minimumCloseAmount;
    @Column(name = "observaciones") private String observations;
    @Column(name = "version_actual", nullable = false) private Integer currentVersion;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public Long getOrganizationId(){return organizationId;} public void setOrganizationId(Long organizationId){this.organizationId=organizationId;} public Long getBranchId(){return branchId;} public void setBranchId(Long branchId){this.branchId=branchId;} public LocalDate getBudgetDate(){return budgetDate;} public void setBudgetDate(LocalDate budgetDate){this.budgetDate=budgetDate;} public String getReportStatusCode(){return reportStatusCode;} public void setReportStatusCode(String reportStatusCode){this.reportStatusCode=reportStatusCode;} public BigDecimal getLaborWithoutVat(){return laborWithoutVat;} public void setLaborWithoutVat(BigDecimal laborWithoutVat){this.laborWithoutVat=laborWithoutVat;} public BigDecimal getVatRate(){return vatRate;} public void setVatRate(BigDecimal vatRate){this.vatRate=vatRate;} public BigDecimal getLaborVat(){return laborVat;} public void setLaborVat(BigDecimal laborVat){this.laborVat=laborVat;} public BigDecimal getLaborWithVat(){return laborWithVat;} public void setLaborWithVat(BigDecimal laborWithVat){this.laborWithVat=laborWithVat;} public BigDecimal getPartsTotal(){return partsTotal;} public void setPartsTotal(BigDecimal partsTotal){this.partsTotal=partsTotal;} public BigDecimal getTotalQuoted(){return totalQuoted;} public void setTotalQuoted(BigDecimal totalQuoted){this.totalQuoted=totalQuoted;} public Integer getEstimatedDays(){return estimatedDays;} public void setEstimatedDays(Integer estimatedDays){this.estimatedDays=estimatedDays;} public BigDecimal getMinimumCloseAmount(){return minimumCloseAmount;} public void setMinimumCloseAmount(BigDecimal minimumCloseAmount){this.minimumCloseAmount=minimumCloseAmount;} public String getObservations(){return observations;} public void setObservations(String observations){this.observations=observations;} public Integer getCurrentVersion(){return currentVersion;} public void setCurrentVersion(Integer currentVersion){this.currentVersion=currentVersion;}
}
