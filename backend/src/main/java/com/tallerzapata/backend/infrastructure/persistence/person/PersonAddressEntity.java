package com.tallerzapata.backend.infrastructure.persistence.person;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "persona_domicilios")
public class PersonAddressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "persona_id", nullable = false)
    private Long personId;

    @Column(name = "tipo_domicilio_codigo", nullable = false)
    private String addressTypeCode;

    @Column(name = "calle")
    private String street;

    @Column(name = "numero")
    private String number;

    @Column(name = "piso")
    private String floor;

    @Column(name = "depto")
    private String apartment;

    @Column(name = "localidad")
    private String city;

    @Column(name = "provincia")
    private String province;

    @Column(name = "codigo_postal")
    private String postalCode;

    @Column(name = "pais_codigo")
    private String countryCode;

    @Column(name = "principal", nullable = false)
    private Boolean principal;

    @PrePersist
    void prePersist() {
        if (principal == null) {
            principal = false;
        }
    }

    public Long getId() { return id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getAddressTypeCode() { return addressTypeCode; }
    public void setAddressTypeCode(String addressTypeCode) { this.addressTypeCode = addressTypeCode; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getApartment() { return apartment; }
    public void setApartment(String apartment) { this.apartment = apartment; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public Boolean getPrincipal() { return principal; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }
}
