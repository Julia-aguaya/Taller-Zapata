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

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getCode() { return code; }
    public String getName() { return name; }
}
