package com.tallerzapata.backend.infrastructure.persistence.person;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "personas")
public class PersonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "tipo_persona", nullable = false, columnDefinition = "enum('fisica','juridica')")
    private String tipoPersona;

    private String nombre;
    private String apellido;

    @Column(name = "razon_social")
    private String razonSocial;

    @Column(name = "nombre_mostrar", nullable = false)
    private String nombreMostrar;

    @Column(name = "tipo_documento_codigo")
    private String tipoDocumentoCodigo;

    @Column(name = "numero_documento")
    private String numeroDocumento;

    @Column(name = "numero_documento_normalizado")
    private String numeroDocumentoNormalizado;

    @Column(name = "cuit_cuil")
    private String cuitCuil;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "telefono_principal")
    private String telefonoPrincipal;

    @Column(name = "email_principal")
    private String emailPrincipal;

    private String ocupacion;
    private String observaciones;
    private Boolean activo;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (activo == null) {
            activo = true;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public String getTipoPersona() { return tipoPersona; }
    public void setTipoPersona(String tipoPersona) { this.tipoPersona = tipoPersona; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getNombreMostrar() { return nombreMostrar; }
    public void setNombreMostrar(String nombreMostrar) { this.nombreMostrar = nombreMostrar; }
    public String getTipoDocumentoCodigo() { return tipoDocumentoCodigo; }
    public void setTipoDocumentoCodigo(String tipoDocumentoCodigo) { this.tipoDocumentoCodigo = tipoDocumentoCodigo; }
    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }
    public String getNumeroDocumentoNormalizado() { return numeroDocumentoNormalizado; }
    public void setNumeroDocumentoNormalizado(String numeroDocumentoNormalizado) { this.numeroDocumentoNormalizado = numeroDocumentoNormalizado; }
    public String getCuitCuil() { return cuitCuil; }
    public void setCuitCuil(String cuitCuil) { this.cuitCuil = cuitCuil; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getTelefonoPrincipal() { return telefonoPrincipal; }
    public void setTelefonoPrincipal(String telefonoPrincipal) { this.telefonoPrincipal = telefonoPrincipal; }
    public String getEmailPrincipal() { return emailPrincipal; }
    public void setEmailPrincipal(String emailPrincipal) { this.emailPrincipal = emailPrincipal; }
    public String getOcupacion() { return ocupacion; }
    public void setOcupacion(String ocupacion) { this.ocupacion = ocupacion; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
