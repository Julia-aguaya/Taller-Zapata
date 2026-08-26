package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "secuencias_presupuesto_extra")
public class ExtraBudgetBranchSequenceEntity {
    @EmbeddedId private Id id;
    @Column(name = "proximo_numero", nullable = false) private Long nextNumber;

    public Id getId() { return id; }
    public void setId(Id id) { this.id = id; }
    public Long getNextNumber() { return nextNumber; }
    public void setNextNumber(Long nextNumber) { this.nextNumber = nextNumber; }

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "organizacion_id") private Long organizationId;
        @Column(name = "sucursal_id") private Long branchId;

        public Long getOrganizationId() { return organizationId; }
        public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }

        @Override
        public boolean equals(Object other) {
            if (this == other) return true;
            if (!(other instanceof Id that)) return false;
            return Objects.equals(organizationId, that.organizationId) && Objects.equals(branchId, that.branchId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(organizationId, branchId);
        }
    }
}
