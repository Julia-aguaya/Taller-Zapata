package com.tallerzapata.backend.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<BranchEntity, Long> {

    List<BranchEntity> findAllByOrderByNameAsc();

    List<BranchEntity> findByOrganizationIdOrderByNameAsc(Long organizationId);
}
