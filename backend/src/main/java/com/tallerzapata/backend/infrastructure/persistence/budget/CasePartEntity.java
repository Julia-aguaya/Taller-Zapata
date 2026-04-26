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
@Table(name = "repuestos_caso")
public class CasePartEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "presupuesto_item_id") private Long budgetItemId;
    @Column(name = "descripcion", nullable = false) private String description;
    @Column(name = "codigo_pieza") private String partCode;
    @Column(name = "proveedor_final") private String finalSupplier;
    @Column(name = "autorizado_codigo") private String authorizedCode;
    @Column(name = "estado_codigo", nullable = false) private String statusCode;
    @Column(name = "compra_por_codigo") private String purchasedByCode;
    @Column(name = "pago_estado_codigo") private String paymentStatusCode;
    @Column(name = "precio_presupuestado") private BigDecimal budgetedPrice;
    @Column(name = "precio_final") private BigDecimal finalPrice;
    @Column(name = "fecha_recibido") private LocalDate receivedDate;
    @Column(name = "usado", nullable = false) private Boolean used;
    @Column(name = "devuelto", nullable = false) private Boolean returned;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public Long getBudgetItemId(){return budgetItemId;} public void setBudgetItemId(Long budgetItemId){this.budgetItemId=budgetItemId;} public String getDescription(){return description;} public void setDescription(String description){this.description=description;} public String getPartCode(){return partCode;} public void setPartCode(String partCode){this.partCode=partCode;} public String getFinalSupplier(){return finalSupplier;} public void setFinalSupplier(String finalSupplier){this.finalSupplier=finalSupplier;} public String getAuthorizedCode(){return authorizedCode;} public void setAuthorizedCode(String authorizedCode){this.authorizedCode=authorizedCode;} public String getStatusCode(){return statusCode;} public void setStatusCode(String statusCode){this.statusCode=statusCode;} public String getPurchasedByCode(){return purchasedByCode;} public void setPurchasedByCode(String purchasedByCode){this.purchasedByCode=purchasedByCode;} public String getPaymentStatusCode(){return paymentStatusCode;} public void setPaymentStatusCode(String paymentStatusCode){this.paymentStatusCode=paymentStatusCode;} public BigDecimal getBudgetedPrice(){return budgetedPrice;} public void setBudgetedPrice(BigDecimal budgetedPrice){this.budgetedPrice=budgetedPrice;} public BigDecimal getFinalPrice(){return finalPrice;} public void setFinalPrice(BigDecimal finalPrice){this.finalPrice=finalPrice;} public LocalDate getReceivedDate(){return receivedDate;} public void setReceivedDate(LocalDate receivedDate){this.receivedDate=receivedDate;} public Boolean getUsed(){return used;} public void setUsed(Boolean used){this.used=used;} public Boolean getReturned(){return returned;} public void setReturned(Boolean returned){this.returned=returned;}
}
