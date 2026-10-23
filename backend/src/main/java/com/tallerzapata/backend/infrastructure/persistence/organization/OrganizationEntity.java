package com.tallerzapata.backend.infrastructure.persistence.organization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "organizaciones")
public class OrganizationEntity {

    @Id
    private Long id;

    @Column(name = "public_id", nullable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "razon_social")
    private String razonSocial;

    @Column(name = "telefono")
    private String phone;

    @Column(name = "email")
    private String email;

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getRazonSocial() { return razonSocial; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public void setName(String name) { this.name = name; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
}
