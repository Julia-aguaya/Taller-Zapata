package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "companias_contactos")
public class InsuranceCompanyContactEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "compania_id", nullable = false) private Long companyId;
    @Column(name = "persona_id", nullable = false) private Long personId;
    @Column(name = "rol_contacto_codigo", nullable = false) private String contactRoleCode;
    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getContactRoleCode() { return contactRoleCode; }
    public void setContactRoleCode(String contactRoleCode) { this.contactRoleCode = contactRoleCode; }
}
