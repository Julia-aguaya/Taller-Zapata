package com.tallerzapata.backend.infrastructure.persistence.provider;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "proveedores")
public class ProviderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)") private String publicId;
    @Column(name = "nombre", nullable = false) private String name;
    @Column(name = "telefono") private String phone;
    @Column(name = "email") private String email;
    @Column(name = "activo", nullable = false) private Boolean active;
    @PrePersist void prePersist() { if (publicId == null) publicId = UUID.randomUUID().toString(); if (active == null) active = true; }
    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
