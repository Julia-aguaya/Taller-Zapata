package com.tallerzapata.backend.infrastructure.persistence.organization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sucursales")
public class BranchEntity {

    @Id
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "direccion_linea1")
    private String addressLine1;

    @Column(name = "ciudad")
    private String city;

    @Column(name = "provincia")
    private String province;

    @Column(name = "telefono")
    private String phone;

    @Column(name = "whatsapp")
    private String whatsapp;

    @Column(name = "email")
    private String email;

    @Column(name = "cuit")
    private String cuit;

    @Column(name = "condicion_iva")
    private String condicionIva;

    @Column(name = "logo_document_id")
    private Long logoDocumentId;

    public Long getId() { return id; }
    public Long getOrganizationId() { return organizationId; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getAddressLine1() { return addressLine1; }
    public String getCity() { return city; }
    public String getProvince() { return province; }
    public String getPhone() { return phone; }
    public String getWhatsapp() { return whatsapp; }
    public String getEmail() { return email; }
    public String getCuit() { return cuit; }
    public String getCondicionIva() { return condicionIva; }
    public Long getLogoDocumentId() { return logoDocumentId; }
    public void setName(String name) { this.name = name; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }
    public void setCity(String city) { this.city = city; }
    public void setProvince(String province) { this.province = province; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public void setEmail(String email) { this.email = email; }
    public void setCuit(String cuit) { this.cuit = cuit; }
    public void setCondicionIva(String condicionIva) { this.condicionIva = condicionIva; }
    public void setLogoDocumentId(Long logoDocumentId) { this.logoDocumentId = logoDocumentId; }
}
