package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "legal_rubros_recuperables")
public class LegalRecoverableItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_legal_id", nullable = false) private Long caseLegalId;
    @Column(name = "concepto", nullable = false) private String concept;
    @Column(name = "monto", nullable = false) private BigDecimal amount;
    @Column(name = "suma_taller", nullable = false) private Boolean sumsToWorkshop;
    @Column(name = "estado_cobro_codigo", nullable = false) private String collectionStatusCode;
    @Column(name = "movimiento_financiero_id") private Long financialMovementId;
    public Long getId(){return id;} public Long getCaseLegalId(){return caseLegalId;} public void setCaseLegalId(Long value){caseLegalId=value;} public String getConcept(){return concept;} public void setConcept(String value){concept=value;} public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal value){amount=value;} public Boolean getSumsToWorkshop(){return sumsToWorkshop;} public void setSumsToWorkshop(Boolean value){sumsToWorkshop=value;} public String getCollectionStatusCode(){return collectionStatusCode;} public void setCollectionStatusCode(String value){collectionStatusCode=value;} public Long getFinancialMovementId(){return financialMovementId;} public void setFinancialMovementId(Long value){financialMovementId=value;}
}
