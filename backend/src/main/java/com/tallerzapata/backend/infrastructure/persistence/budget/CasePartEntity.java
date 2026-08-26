package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    @Column(name = "proveedor_id") private Long providerId;
    @Column(name = "autorizado_codigo") private String authorizedCode;
    @Column(name = "estado_codigo", nullable = false) private String statusCode;
    @Column(name = "compra_por_codigo") private String purchasedByCode;
    @Column(name = "pago_estado_codigo") private String paymentStatusCode;
    @Column(name = "precio_presupuestado") private BigDecimal budgetedPrice;
    @Column(name = "precio_final") private BigDecimal finalPrice;
    @Column(name = "fecha_recibido") private LocalDate receivedDate;
    @Column(name = "usado", nullable = false) private Boolean used;
    @Column(name = "devuelto", nullable = false) private Boolean returned;
    @Column(name = "numero_inventario") private String inventoryNumber;
    @Column(name = "source_comparison_piece_id") private Long sourceComparisonPieceId;
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false) private CasePartSourceType sourceType;
    @Column(name = "accessory_work_id") private Long accessoryWorkId;
    @Column(name = "presupuesto_extra_item_id") private Long extraBudgetItemId;
    @Column(name = "non_canonical", nullable = false) private Boolean nonCanonical;
    @Column(name = "is_accessory", nullable = false) private Boolean accessory;
    @Enumerated(EnumType.STRING)
    @Column(name = "provider_assignment_origin") private ProviderAssignmentOrigin providerAssignmentOrigin;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public Long getBudgetItemId(){return budgetItemId;} public void setBudgetItemId(Long budgetItemId){this.budgetItemId=budgetItemId;} public String getDescription(){return description;} public void setDescription(String description){this.description=description;} public String getPartCode(){return partCode;} public void setPartCode(String partCode){this.partCode=partCode;} public String getFinalSupplier(){return finalSupplier;} public void setFinalSupplier(String finalSupplier){this.finalSupplier=finalSupplier;} public Long getProviderId(){return providerId;} public void setProviderId(Long providerId){this.providerId=providerId;} public String getAuthorizedCode(){return authorizedCode;} public void setAuthorizedCode(String authorizedCode){this.authorizedCode=authorizedCode;} public String getStatusCode(){return statusCode;} public void setStatusCode(String statusCode){this.statusCode=statusCode;} public String getPurchasedByCode(){return purchasedByCode;} public void setPurchasedByCode(String purchasedByCode){this.purchasedByCode=purchasedByCode;} public String getPaymentStatusCode(){return paymentStatusCode;} public void setPaymentStatusCode(String paymentStatusCode){this.paymentStatusCode=paymentStatusCode;} public BigDecimal getBudgetedPrice(){return budgetedPrice;} public void setBudgetedPrice(BigDecimal budgetedPrice){this.budgetedPrice=budgetedPrice;} public BigDecimal getFinalPrice(){return finalPrice;} public void setFinalPrice(BigDecimal finalPrice){this.finalPrice=finalPrice;} public LocalDate getReceivedDate(){return receivedDate;} public void setReceivedDate(LocalDate receivedDate){this.receivedDate=receivedDate;} public Boolean getUsed(){return used;} public void setUsed(Boolean used){this.used=used;} public Boolean getReturned(){return returned;} public void setReturned(Boolean returned){this.returned=returned;} public String getInventoryNumber(){return inventoryNumber;} public void setInventoryNumber(String inventoryNumber){this.inventoryNumber=inventoryNumber;} public Long getSourceComparisonPieceId(){return sourceComparisonPieceId;} public void setSourceComparisonPieceId(Long value){sourceComparisonPieceId=value;}
    public ProviderAssignmentOrigin getProviderAssignmentOrigin(){return providerAssignmentOrigin;}
    public void setProviderAssignmentOrigin(ProviderAssignmentOrigin providerAssignmentOrigin){this.providerAssignmentOrigin=providerAssignmentOrigin;}
    public CasePartSourceType getSourceType(){return sourceType;}
    public void setSourceType(CasePartSourceType sourceType){this.sourceType=sourceType;}
    public Long getAccessoryWorkId(){return accessoryWorkId;}
    public void setAccessoryWorkId(Long accessoryWorkId){this.accessoryWorkId=accessoryWorkId;}
    public Long getExtraBudgetItemId(){return extraBudgetItemId;}
    public void setExtraBudgetItemId(Long extraBudgetItemId){this.extraBudgetItemId=extraBudgetItemId;}
    public Boolean getNonCanonical(){return nonCanonical;}
    public void setNonCanonical(Boolean nonCanonical){this.nonCanonical=nonCanonical;}
    public Boolean getAccessory(){return accessory;}
    public void setAccessory(Boolean accessory){this.accessory=accessory;}
}
