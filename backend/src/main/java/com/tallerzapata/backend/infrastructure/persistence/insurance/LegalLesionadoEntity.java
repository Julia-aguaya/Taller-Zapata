package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_legal_lesionados")
public class LegalLesionadoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_legal_id", nullable = false)
    private Long caseLegalId;

    @Column(name = "lesionado_es_codigo")
    private String lesionadoEsCode;

    @Column(name = "persona_id")
    private Long personId;

    @Column(name = "nombre")
    private String fullName;

    @Column(name = "documento")
    private String documentNumber;

    @Column(name = "acredita_ingresos")
    private Boolean provesIncome;

    public Long getId() { return id; }
    public Long getCaseLegalId() { return caseLegalId; }
    public String getLesionadoEsCode() { return lesionadoEsCode; }
    public Long getPersonId() { return personId; }
    public String getFullName() { return fullName; }
    public String getDocumentNumber() { return documentNumber; }
    public Boolean getProvesIncome() { return provesIncome; }
    public void setCaseLegalId(Long caseLegalId) { this.caseLegalId = caseLegalId; }
    public void setLesionadoEsCode(String lesionadoEsCode) { this.lesionadoEsCode = lesionadoEsCode; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public void setProvesIncome(Boolean provesIncome) { this.provesIncome = provesIncome; }
}
