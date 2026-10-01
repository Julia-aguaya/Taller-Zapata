package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_terceros_abogado_siniestro")
public class LawyerThirdPartyIncidentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "dominio_tercero") private String thirdPartyPlate;
    @Column(name = "marca_tercero") private String thirdPartyMake;
    @Column(name = "modelo_tercero") private String thirdPartyModel;
    @Column(name = "conductor_nombre") private String driverName;
    @Column(name = "conductor_dni") private String driverDni;
    @Column(name = "conductor_domicilio") private String driverAddress;
    @Column(name = "conductor_es_titular") private Boolean driverIsOwner;
    @Column(name = "titular_nombre") private String ownerName;
    @Column(name = "titular_dni") private String ownerDni;
    @Column(name = "titular_domicilio") private String ownerAddress;
    @Column(name = "porcentaje_titularidad") private Integer ownershipPercentage;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getThirdPartyPlate() { return thirdPartyPlate; }
    public void setThirdPartyPlate(String thirdPartyPlate) { this.thirdPartyPlate = thirdPartyPlate; }
    public String getThirdPartyMake() { return thirdPartyMake; }
    public void setThirdPartyMake(String thirdPartyMake) { this.thirdPartyMake = thirdPartyMake; }
    public String getThirdPartyModel() { return thirdPartyModel; }
    public void setThirdPartyModel(String thirdPartyModel) { this.thirdPartyModel = thirdPartyModel; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverDni() { return driverDni; }
    public void setDriverDni(String driverDni) { this.driverDni = driverDni; }
    public String getDriverAddress() { return driverAddress; }
    public void setDriverAddress(String driverAddress) { this.driverAddress = driverAddress; }
    public Boolean getDriverIsOwner() { return driverIsOwner; }
    public void setDriverIsOwner(Boolean driverIsOwner) { this.driverIsOwner = driverIsOwner; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getOwnerDni() { return ownerDni; }
    public void setOwnerDni(String ownerDni) { this.ownerDni = ownerDni; }
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    public Integer getOwnershipPercentage() { return ownershipPercentage; }
    public void setOwnershipPercentage(Integer ownershipPercentage) { this.ownershipPercentage = ownershipPercentage; }
}
