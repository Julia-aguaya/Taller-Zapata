package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.*;

@Entity
@Table(name = "comparacion_presupuesto_extra_piezas")
public class ExtraBudgetComparisonPieceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_extra_item_id", nullable = false) private Long itemId;
    @Column(name = "descripcion", nullable = false) private String description;
    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
