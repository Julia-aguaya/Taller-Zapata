package com.tallerzapata.backend.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, Long> {

    List<OrganizationEntity> findAllByOrderByNameAsc();
}
