package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "caso_siniestro")
public class CaseIncidentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "fecha_siniestro")
    private LocalDate incidentDate;

    @Column(name = "hora_siniestro")
    private LocalTime incidentTime;

    private String lugar;
    private String dinamica;
    private String observaciones;

    @Column(name = "fecha_prescripcion")
    private LocalDate prescriptionDate;

    @Column(name = "dias_tramitando")
    private Integer daysInProcess;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public LocalTime getIncidentTime() { return incidentTime; }
    public String getLugar() { return lugar; }
    public String getDinamica() { return dinamica; }
    public String getObservaciones() { return observaciones; }
    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public Integer getDaysInProcess() { return daysInProcess; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setIncidentDate(LocalDate incidentDate) { this.incidentDate = incidentDate; }
    public void setIncidentTime(LocalTime incidentTime) { this.incidentTime = incidentTime; }
    public void setLugar(String lugar) { this.lugar = lugar; }
    public void setDinamica(String dinamica) { this.dinamica = dinamica; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public void setPrescriptionDate(LocalDate prescriptionDate) { this.prescriptionDate = prescriptionDate; }
    public void setDaysInProcess(Integer daysInProcess) { this.daysInProcess = daysInProcess; }
}
