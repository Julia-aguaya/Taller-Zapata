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
@Table(name = "legal_gastos")
public class LegalExpenseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_legal_id", nullable = false) private Long caseLegalId;
    @Column(name = "concepto", nullable = false) private String concept;
    @Column(name = "monto", nullable = false) private BigDecimal amount;
    @Column(name = "fecha_gasto", nullable = false) private LocalDate expenseDate;
    @Column(name = "pagado_por_codigo") private String paidByCode;
    @Column(name = "movimiento_financiero_id") private Long financialMovementId;
    public Long getId(){return id;} public Long getCaseLegalId(){return caseLegalId;} public void setCaseLegalId(Long caseLegalId){this.caseLegalId=caseLegalId;} public String getConcept(){return concept;} public void setConcept(String concept){this.concept=concept;} public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal amount){this.amount=amount;} public LocalDate getExpenseDate(){return expenseDate;} public void setExpenseDate(LocalDate expenseDate){this.expenseDate=expenseDate;} public String getPaidByCode(){return paidByCode;} public void setPaidByCode(String paidByCode){this.paidByCode=paidByCode;} public Long getFinancialMovementId(){return financialMovementId;} public void setFinancialMovementId(Long financialMovementId){this.financialMovementId=financialMovementId;}
}
