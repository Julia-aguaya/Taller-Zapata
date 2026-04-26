package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pagado_por_gasto_legal")
public class LegalExpensePayerEntity { @Id @Column(name = "codigo", nullable = false) private String code; @Column(name = "nombre", nullable = false) private String name; @Column(name = "activo", nullable = false) private Boolean active; public String getCode(){return code;} public String getName(){return name;} public Boolean getActive(){return active;} }
