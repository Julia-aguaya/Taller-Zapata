package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

    @Query("select coalesce(max(c.orderNumber), 0) from CaseEntity c where c.organizationId = :organizationId")
    Long findMaxOrderNumberByOrganizationId(Long organizationId);

    List<CaseEntity> findAllByOrderByIdDesc(Pageable pageable);
}
