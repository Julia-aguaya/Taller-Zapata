package com.tallerzapata.backend.infrastructure.persistence.person;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "persona_contactos")
public class PersonContactEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "persona_id", nullable = false)
    private Long personId;

    @Column(name = "tipo_contacto_codigo", nullable = false)
    private String contactTypeCode;

    @Column(name = "valor", nullable = false)
    private String value;

    @Column(name = "principal", nullable = false)
    private Boolean principal;

    @Column(name = "validado", nullable = false)
    private Boolean validated;

    private String observaciones;

    @PrePersist
    void prePersist() {
        if (principal == null) {
            principal = false;
        }
        if (validated == null) {
            validated = false;
        }
    }

    public Long getId() { return id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getContactTypeCode() { return contactTypeCode; }
    public void setContactTypeCode(String contactTypeCode) { this.contactTypeCode = contactTypeCode; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Boolean getPrincipal() { return principal; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }
    public Boolean getValidated() { return validated; }
    public void setValidated(Boolean validated) { this.validated = validated; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
