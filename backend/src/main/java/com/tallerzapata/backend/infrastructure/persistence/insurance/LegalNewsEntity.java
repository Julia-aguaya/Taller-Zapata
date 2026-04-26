package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "legal_novedades")
public class LegalNewsEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_legal_id", nullable = false) private Long caseLegalId;
    @Column(name = "fecha_novedad", nullable = false) private LocalDate newsDate;
    @Column(name = "detalle", nullable = false) private String detail;
    @Column(name = "notificar_cliente", nullable = false) private Boolean notifyCustomer;
    @Column(name = "notificado_at") private LocalDateTime notifiedAt;
    public Long getId(){return id;} public Long getCaseLegalId(){return caseLegalId;} public void setCaseLegalId(Long caseLegalId){this.caseLegalId=caseLegalId;} public LocalDate getNewsDate(){return newsDate;} public void setNewsDate(LocalDate newsDate){this.newsDate=newsDate;} public String getDetail(){return detail;} public void setDetail(String detail){this.detail=detail;} public Boolean getNotifyCustomer(){return notifyCustomer;} public void setNotifyCustomer(Boolean notifyCustomer){this.notifyCustomer=notifyCustomer;} public LocalDateTime getNotifiedAt(){return notifiedAt;} public void setNotifiedAt(LocalDateTime notifiedAt){this.notifiedAt=notifiedAt;}
}
