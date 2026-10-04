package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

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

    @Column(name = "apellido")
    private String lastName;

    @Column(name = "nombres")
    private String firstName;

    @Column(name = "fecha_nacimiento")
    private LocalDate birthDate;

    @Column(name = "domicilio")
    private String address;

    @Column(name = "estado_civil_codigo")
    private String civilStatusCode;

    @Column(name = "telefono")
    private String phone;

    @Column(name = "correo")
    private String email;

    @Column(name = "profesion")
    private String profession;

    @Column(name = "anotaciones")
    private String notes;

    public Long getId() { return id; }
    public Long getCaseLegalId() { return caseLegalId; }
    public String getLesionadoEsCode() { return lesionadoEsCode; }
    public Long getPersonId() { return personId; }
    public String getFullName() { return fullName; }
    public String getDocumentNumber() { return documentNumber; }
    public Boolean getProvesIncome() { return provesIncome; }
    public String getLastName() { return lastName; }
    public String getFirstName() { return firstName; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getAddress() { return address; }
    public String getCivilStatusCode() { return civilStatusCode; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getProfession() { return profession; }
    public String getNotes() { return notes; }
    public void setCaseLegalId(Long caseLegalId) { this.caseLegalId = caseLegalId; }
    public void setLesionadoEsCode(String lesionadoEsCode) { this.lesionadoEsCode = lesionadoEsCode; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public void setProvesIncome(Boolean provesIncome) { this.provesIncome = provesIncome; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public void setAddress(String address) { this.address = address; }
    public void setCivilStatusCode(String civilStatusCode) { this.civilStatusCode = civilStatusCode; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setProfession(String profession) { this.profession = profession; }
    public void setNotes(String notes) { this.notes = notes; }
}
