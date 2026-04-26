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
@Table(name = "caso_cleas")
public class CaseCleasEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "alcance_codigo") private String scopeCode;
    @Column(name = "dictamen_codigo") private String opinionCode;
    @Column(name = "monto_franquicia") private BigDecimal franchiseAmount;
    @Column(name = "monto_cargo_cliente") private BigDecimal customerChargeAmount;
    @Column(name = "estado_pago_cliente_codigo") private String customerPaymentStatusCode;
    @Column(name = "fecha_pago_cliente") private LocalDate customerPaymentDate;
    @Column(name = "monto_pago_compania_franquicia") private BigDecimal companyFranchisePaymentAmount;
    @Column(name = "estado_pago_compania_franquicia_codigo") private String companyFranchisePaymentStatusCode;
    @Column(name = "fecha_pago_compania_franquicia") private LocalDate companyFranchisePaymentDate;

    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public String getScopeCode(){return scopeCode;} public void setScopeCode(String scopeCode){this.scopeCode=scopeCode;} public String getOpinionCode(){return opinionCode;} public void setOpinionCode(String opinionCode){this.opinionCode=opinionCode;} public BigDecimal getFranchiseAmount(){return franchiseAmount;} public void setFranchiseAmount(BigDecimal franchiseAmount){this.franchiseAmount=franchiseAmount;} public BigDecimal getCustomerChargeAmount(){return customerChargeAmount;} public void setCustomerChargeAmount(BigDecimal customerChargeAmount){this.customerChargeAmount=customerChargeAmount;} public String getCustomerPaymentStatusCode(){return customerPaymentStatusCode;} public void setCustomerPaymentStatusCode(String customerPaymentStatusCode){this.customerPaymentStatusCode=customerPaymentStatusCode;} public LocalDate getCustomerPaymentDate(){return customerPaymentDate;} public void setCustomerPaymentDate(LocalDate customerPaymentDate){this.customerPaymentDate=customerPaymentDate;} public BigDecimal getCompanyFranchisePaymentAmount(){return companyFranchisePaymentAmount;} public void setCompanyFranchisePaymentAmount(BigDecimal companyFranchisePaymentAmount){this.companyFranchisePaymentAmount=companyFranchisePaymentAmount;} public String getCompanyFranchisePaymentStatusCode(){return companyFranchisePaymentStatusCode;} public void setCompanyFranchisePaymentStatusCode(String companyFranchisePaymentStatusCode){this.companyFranchisePaymentStatusCode=companyFranchisePaymentStatusCode;} public LocalDate getCompanyFranchisePaymentDate(){return companyFranchisePaymentDate;} public void setCompanyFranchisePaymentDate(LocalDate companyFranchisePaymentDate){this.companyFranchisePaymentDate=companyFranchisePaymentDate;}
}
