package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "acciones_presupuesto")
public class BudgetActionEntity {
    @Id @Column(name = "codigo", nullable = false) private String code;
    @Column(name = "nombre", nullable = false) private String name;
    @Column(name = "nombre_normalizado", nullable = false) private String normalizedName;
    @Column(name = "activo", nullable = false) private Boolean active;

    public String getCode(){return code;}
    public void setCode(String code) { this.code = code; }
    public String getName(){return name;}
    public void setName(String name) { this.name = name; }
    public String getNormalizedName() { return normalizedName; }
    public void setNormalizedName(String normalizedName) { this.normalizedName = normalizedName; }
    public Boolean getActive(){return active;}
    public void setActive(Boolean active) { this.active = active; }
}
