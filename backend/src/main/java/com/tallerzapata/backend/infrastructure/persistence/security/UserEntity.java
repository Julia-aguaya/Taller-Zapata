package com.tallerzapata.backend.infrastructure.persistence.security;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class UserEntity {

    @Id
    private Long id;

    @Column(name = "public_id", nullable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "nombre", nullable = false)
    private String firstName;

    @Column(name = "apellido")
    private String lastName;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public Boolean getActive() { return active; }
}
